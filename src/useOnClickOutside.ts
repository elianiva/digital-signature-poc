// https://usehooks.com/useOnClickOutside/

import { useEffect } from "react";

// Hook
// too lazy to add types
export function useOnClickOutside<T>(ref: any, handler: any) {
    useEffect(() => {
        const listener = (event: any) => {
            // Do nothing if clicking ref's element or descendent elements
            if (!ref.current || ref.current.contains(event.target)) {
                return;
            }
            handler(event);
        };
        document.addEventListener("mousedown", listener);
        document.addEventListener("touchstart", listener);
        return () => {
            document.removeEventListener("mousedown", listener);
            document.removeEventListener("touchstart", listener);
        };
    }, [ref, handler]);
}
