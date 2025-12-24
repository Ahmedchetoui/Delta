import React from 'react';

const Skeleton = ({ className = '', variant = 'rect' }) => {
    const baseClasses = "animate-pulse bg-gray-200";

    const variants = {
        rect: "rounded-lg",
        circle: "rounded-full",
        text: "rounded h-4 w-full"
    };

    return (
        <div className={`${baseClasses} ${variants[variant]} ${className}`} />
    );
};

export default Skeleton;
