/**
 * Scroll to an element and center it in the viewport
 * @param {string} elementId - The ID of the element to scroll to
 * @param {number} offset - Additional offset in pixels (default: 0)
 */
export const scrollToCenter = (elementId, offset = 0) => {
    const element = document.getElementById(elementId);

    if (!element) {
        console.warn(`Element with ID "${elementId}" not found`);
        return;
    }

    // Get the element's position
    const elementRect = element.getBoundingClientRect();
    const elementTop = elementRect.top + window.pageYOffset;
    const elementHeight = elementRect.height;

    // Calculate viewport height
    const viewportHeight = window.innerHeight;

    // Calculate the position to center the element
    // Position = element top - (viewport height / 2) + (element height / 2) + offset
    const scrollToPosition = elementTop - (viewportHeight / 2) + (elementHeight / 2) + offset;

    // Smooth scroll to the calculated position
    window.scrollTo({
        top: scrollToPosition,
        behavior: 'smooth'
    });
};

/**
 * Scroll to top of the page
 */
export const scrollToTop = () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
};
