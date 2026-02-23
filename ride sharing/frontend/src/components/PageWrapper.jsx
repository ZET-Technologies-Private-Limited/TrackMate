import React from 'react';
import { motion } from 'framer-motion';

const pageVariants = {
    initial: {
        opacity: 0,
        rotateY: -30,
        z: -100,
        scale: 0.9
    },
    animate: {
        opacity: 1,
        rotateY: 0,
        z: 0,
        scale: 1,
        transition: {
            duration: 0.6,
            ease: [0.22, 1, 0.36, 1]
        }
    },
    exit: {
        opacity: 0,
        rotateY: 30,
        z: -100,
        scale: 0.9,
        transition: {
            duration: 0.4,
            ease: [0.22, 1, 0.36, 1]
        }
    }
};

const PageWrapper = ({ children }) => {
    return (
        <motion.div
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageVariants}
            style={{
                perspective: "1200px",
                transformStyle: "preserve-3d",
                width: "100%",
                minHeight: "100vh"
            }}
        >
            {children}
        </motion.div>
    );
};

export default PageWrapper;
