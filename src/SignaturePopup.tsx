import { useRef } from "react";
import SignaturePad from "react-signature-pad-wrapper";
import { useAppContext } from "./AppContext";

export function SignaturePopup() {
    const { setSignature, setSignaturePopupVisibility } = useAppContext();
    const signaturePad = useRef<SignaturePad>(null);

    function handlePadReset() {
        signaturePad.current?.clear();
        setSignature("");
    }

    function handleConfirm() {
        if (signaturePad.current === null) {
            alert("invalid");
            return;
        }

        setSignature(signaturePad.current.toDataURL("image/png"));
        setSignaturePopupVisibility(false);
    }

    function handleCancel() {
        signaturePad.current?.clear();
        setSignaturePopupVisibility(false);
        setSignature("");
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm z-50">
            <div className="flex flex-col gap-4">
                <div className="bg-white w-[320px] h-[180px] overflow-hidden rounded-lg">
                    <SignaturePad
                        ref={signaturePad}
                        options={{
                            minWidth: 2,
                            maxWidth: 4,
                            dotSize: 1,
                            penColor: "rgb(15 23 42)",
                        }}
                    />
                </div>
                <div className="flex gap-4 w-full">
                    <button
                        className="font-bold px-4 py-2 bg-teal-200 hover:bg-teal-300 cursor-pointer text-teal-700 rounded-md mx-auto"
                        onClick={handleConfirm}
                    >
                        Confirm
                    </button>
                    <div className="flex-1" />
                    <button
                        className="font-bold px-4 py-2 bg-slate-200 hover:bg-slate-300 cursor-pointer text-slate-700 rounded-md mx-auto"
                        onClick={handlePadReset}
                    >
                        Reset
                    </button>
                    <button
                        className="font-bold px-4 py-2 bg-red-200 hover:bg-red-300 cursor-pointer text-red-700 rounded-md mx-auto"
                        onClick={handleCancel}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}
