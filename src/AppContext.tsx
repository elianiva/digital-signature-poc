import {
    createContext,
    Dispatch,
    PropsWithChildren,
    SetStateAction,
    useContext,
    useState,
} from "react";

type AppContextValue = {
    signature: string;
    setSignature: Dispatch<SetStateAction<string>>;
    isSignaturePopupVisible: boolean;
    setSignaturePopupVisibility: Dispatch<SetStateAction<boolean>>;
};

const appContext = createContext<AppContextValue>({} as AppContextValue);

export function useAppContext() {
    return useContext(appContext);
}

export function AppContextProvider(props: PropsWithChildren<{}>) {
    const [signature, setSignature] = useState<string>("");
    const [isSignaturePopupVisible, setSignaturePopupVisibility] =
        useState(false);

    return (
        <appContext.Provider
            value={{
                signature,
                setSignature,
                isSignaturePopupVisible,
                setSignaturePopupVisibility,
            }}
        >
            {props.children}
        </appContext.Provider>
    );
}
