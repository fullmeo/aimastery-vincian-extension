// Attendre que le DOM soit chargé
document.addEventListener('DOMContentLoaded', () => {
    // Navigation fluide
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 20,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Mettre en surbrillance l'élément de navigation actif
    const sections = document.querySelectorAll('section');
    const navItems = document.querySelectorAll('.nav-item');

    function setActiveNavItem() {
        let current = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            
            if (window.scrollY >= sectionTop - 200) {
                current = '#' + section.getAttribute('id');
            }
        });

        navItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('href') === current) {
                item.classList.add('active');
            }
        });
    }


    // Animation au défilement
    function animateOnScroll() {
        const elements = document.querySelectorAll('.fade-in');
        
        elements.forEach(element => {
            const elementTop = element.getBoundingClientRect().top;
            const windowHeight = window.innerHeight;
            
            if (elementTop < windowHeight - 100) {
                element.classList.add('visible');
            }
        });
    }

    // Écouteurs d'événements
    window.addEventListener('scroll', () => {
        setActiveNavItem();
        animateOnScroll();
    });

    // Initialisation
    setActiveNavItem();
    animateOnScroll();
});

// Fonction pour charger le contenu dynamique
async function loadContent(section) {
    try {
        // Ici, vous pourriez charger du contenu dynamiquement
        // par exemple :
        // const response = await fetch(`/api/${section}`);
        // const data = await response.text();
        // document.querySelector(`#${section}`).innerHTML = data;
        console.log(`Contenu chargé pour la section: ${section}`);
    } catch (error) {
        console.error('Erreur lors du chargement du contenu:', error);
    }
}

// Exporter les fonctions si nécessaire
// export { loadContent };
