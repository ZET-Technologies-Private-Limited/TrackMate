require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const connectDB = require('./config/db');
const ChatMessage = require('./models/ChatMessage');
const Trip = require('./models/Trip');
const Booking = require('./models/Booking');
const Notification = require('./models/Notification');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors());
app.use(express.json());

// Pass io to request
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Socket.IO
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('joinTrip', (tripId) => {
        socket.join(tripId);
        console.log(`User joined trip room: ${tripId}`);
    });

    socket.on('joinUser', (userId) => {
        socket.join(userId);
        console.log(`User joined personal room: ${userId}`);
    });

    socket.on('sendMessage', async (data) => {
        // data: { tripId, senderId, message, senderName }
        try {
            // 1. Broadcast to room (Live Trip) - Everyone receives it via server
            io.to(data.tripId).emit('receiveMessage', data);

            // 2. Persist Message
            await ChatMessage.create({
                tripId: data.tripId,
                senderId: data.senderId,
                message: data.message
            });

            // 3. Notify offline users (Driver or Passengers)
            const trip = await Trip.findById(data.tripId);
            if (!trip) return;

            // Determine recipients
            let recipientIds = [];

            // If sender is driver, notify all accepted passengers
            if (trip.driverId.toString() === data.senderId) {
                const bookings = await Booking.find({ tripId: data.tripId, status: 'ACCEPTED' });
                recipientIds = bookings.map(b => b.passengerId.toString());
            } else {
                // If sender is passenger, notify driver
                recipientIds = [trip.driverId.toString()];
            }

            // Create Notifications
            for (const recipientId of recipientIds) {
                if (recipientId !== data.senderId) {
                    const notifData = {
                        userId: recipientId,
                        type: 'message',
                        title: `New Message from ${data.senderName}`,
                        body: data.message.substring(0, 50) + (data.message.length > 50 ? '...' : ''),
                        refId: data.tripId,
                        refType: 'TRIP',
                        time: 'Just now'
                    };
                    await Notification.create(notifData);
                    io.to(recipientId).emit('newNotification', notifData);
                }
            }

        } catch (err) {
            console.error('SOCKET_MSG_ERROR:', err);
        }
    });

    socket.on('updateLocation', (data) => {
        // data: { tripId, lat, lng }
        io.to(data.tripId).emit('locationUpdated', data);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

// Routes placeholders
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/trips', require('./routes/tripRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/stats', require('./routes/statsRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('SERVER_ERROR:', err.message);
    res.status(500).json({ message: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
    server.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on port ${PORT}`);
    });
});
