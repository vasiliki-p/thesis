import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // κάθε φορά που αλλάζει το path, κάνει scroll στην κορυφή (x:0, y:0)
    window.scrollTo(0, 0);
  }, [pathname]);
  
  // δεν εμφανίζει τίποτα στην οθόνη
  return null;
}