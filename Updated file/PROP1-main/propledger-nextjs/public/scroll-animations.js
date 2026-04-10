// Scroll animation for feature cards
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('scroll-fade-in');
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.1 }
        );

        // Observe all feature cards
        const cards = document.querySelectorAll('.feature-card');
        cards.forEach((card) => observer.observe(card));
    });
}
