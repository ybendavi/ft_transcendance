
import { useRef, useEffect } from "react";

const useOutsideClick = (callback: any) => {
    const ref = useRef<HTMLInputElement>(null);
  
    useEffect(() => {
      const handleClick = (event: any) => {
        if (ref.current && !ref.current.contains(event.target))
          callback();
      };
  
      document.addEventListener('click', handleClick);
  
      return () => {
        document.removeEventListener('click', handleClick);
      };
    }, [callback, ref]);
  
    return ref;
  };
  
  export default useOutsideClick;