// src/components/ScrollToTop.jsx
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Ce composant ne rend rien visuellement.
 * Il surveille l'URL et remonte la page à 0,0 à chaque changement de page.
 */
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // On remonte tout en haut
    window.scrollTo(0, 0);
  }, [pathname]); // Se déclenche dès que le chemin (URL) change

  return null;
};

export default ScrollToTop;