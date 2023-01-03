import {
    type ChangeEvent,
    useRef,
    useState,
    useEffect,
    DragEvent,
} from "react";
import { PDFDocument } from "pdf-lib";
import { pdfjs, Document, Page } from "react-pdf/dist/esm/entry.vite";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import { SignaturePopup } from "./SignaturePopup";
import { useAppContext } from "./AppContext";
import interact from "interactjs";
import { useOnClickOutside } from "./useOnClickOutside";
import { dragMoveListener, resizeListener } from "./listeners";
import { dataURItoBlob, toArrayBuffer } from "./utils";

type Size = {
    width: number;
    height: number;
};

type Point = {
    x: number;
    y: number;
};

export function App() {
    const { isSignaturePopupVisible, setSignaturePopupVisibility, signature } =
        useAppContext();

    // states
    const [maxPageNumber, setMaxPageNumber] = useState<number | null>(null);
    const [currentPageNumber, setCurrentPageNumber] = useState(1);
    const [pdfInfo, setPdfInfo] = useState<string>("");
    const [isSignatureVisible, setSignatureVisibility] = useState(false);
    const [signatureFocused, setSignatureFocus] = useState(true);
    const [signatureSize, setSignatureSize] = useState<Size>({
        width: 0,
        height: 0,
    });
    const [signaturePoint, setSignaturePoint] = useState<Point>({
        x: 0,
        y: 0,
    });
    const [pdfDocument, setPdfDocument] = useState<PDFDocument>();

    // refs
    const inputRef = useRef<HTMLInputElement>(null);
    const signatureRef = useRef<HTMLDivElement>(null);
    const documentRef = useRef<HTMLDivElement>(null);

    useOnClickOutside(signatureRef, () => setSignatureFocus(false));

    useEffect(() => {
        if (signatureRef.current === null) return;
        setSignatureVisibility(signature !== "");
        interact(signatureRef.current)
            .resizable({
                edges: { top: true, right: true, bottom: true, left: true },
                listeners: {
                    move: (event) => {
                        const { width, height } = event.rect;
                        setSignatureSize({ width, height });
                        resizeListener(event);
                    },
                },
                modifiers: [
                    interact.modifiers.restrictEdges({ outer: "parent" }),
                    interact.modifiers.restrictSize({
                        min: { width: 200, height: 120 },
                    }),
                ],
            })
            .draggable({
                listeners: {
                    move: (event) => {
                        const { x: parentX, y: parentY } =
                            documentRef.current!.getBoundingClientRect();
                        const { x: signatureX, y: signatureY } =
                            event.currentTarget.getBoundingClientRect();
                        // setSignaturePoint({
                        //     x: signatureX - parentX,
                        //     y: signatureY - parentY,
                        // });
                        const { x, y } = dragMoveListener(event);
                        setSignaturePoint({ x, y });
                    },
                },
                inertia: false,
                modifiers: [
                    interact.modifiers.restrictRect({
                        restriction: "parent",
                        endOnly: true,
                    }),
                ],
            });
    }, [signature]);

    function onDocumentLoadSuccess({ numPages }: pdfjs.PDFDocumentProxy) {
        setMaxPageNumber(numPages);
    }

    function showFilePicker() {
        inputRef.current?.click();
    }

    async function onFileChange(e: ChangeEvent<HTMLInputElement>) {
        if (
            e.currentTarget.files === null ||
            e.currentTarget.files.length < 1
        ) {
            return;
        }

        const file = e.currentTarget.files[0];
        const fileBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(fileBuffer);
        setPdfDocument(pdfDoc);

        const pdfBytes = await pdfDoc.save();
        const docUrl = URL.createObjectURL(
            new Blob([pdfBytes], { type: "application/pdf" })
        );
        setPdfInfo(docUrl);
    }

    function handleNextPage() {
        setCurrentPageNumber((prev) => Math.min(prev + 1, maxPageNumber ?? 1));
    }

    function handlePrevPage() {
        setCurrentPageNumber((prev) => Math.max(1, prev - 1));
    }

    async function handleSave() {
        if (pdfDocument === undefined) return;

        const page = pdfDocument.getPage(currentPageNumber);
        const signatureBytes = dataURItoBlob(signature);
        const image = await pdfDocument.embedPng(
            await signatureBytes.arrayBuffer()
        );
        if (image === undefined) {
            alert("failed");
            return;
        }

        console.log("ROTATION", page.getRotation());

        const args = {
            ...signatureSize,
            ...signaturePoint,
        };
        console.log(args);

        page?.drawImage(image, args);

        const pdfBytes = await pdfDocument.save();
        const docUrl = URL.createObjectURL(
            new Blob([pdfBytes], { type: "application/pdf" })
        );
        setPdfInfo(docUrl);
    }

    function handleReset() {
        setPdfInfo("");
        setPdfDocument(undefined);
        setSignaturePoint({ x: 0, y: 0 });
        setSignatureSize({ width: 0, height: 0 });
        setMaxPageNumber(null);
        setCurrentPageNumber(1);
        inputRef.current!.value = "";
    }

    return (
        <>
            {isSignaturePopupVisible && <SignaturePopup />}
            <div className="p-8 w-full h-full bg-sky-50">
                <div className="mx-auto max-w-screen-lg bg-white shadow-md rounded-md p-8">
                    <h1 className="text-center font-bold text-4xl text-slate-700">
                        Digital Signing Proof of Concept
                    </h1>
                    <input
                        className="invisible w-0 h-0"
                        type="file"
                        accept=".pdf, application/pdf"
                        ref={inputRef}
                        onChange={onFileChange}
                    />
                    <div className="flex gap-4 items-center mx-auto">
                        <button
                            className="font-bold px-6 py-3 bg-sky-200 hover:bg-sky-300 cursor-pointer text-sky-700 rounded-md mx-auto"
                            onClick={showFilePicker}
                        >
                            Pick a Document
                        </button>
                        <button
                            disabled={pdfInfo === ""}
                            className="font-bold px-6 py-3 bg-teal-200 not:disabled:hover:bg-teal-300 disabled:bg-slate-100 cursor-pointer text-teal-700 disabled:text-slate-400 rounded-md mx-auto disabled:cursor-not-allowed"
                            onClick={() => setSignaturePopupVisibility(true)}
                        >
                            Draw a Signature
                        </button>
                        <button
                            className="font-bold px-6 py-3 bg-red-200 not:disabled:hover:bg-red-300 cursor-pointer text-red-700 disabled:text-slate-400 rounded-md mx-auto"
                            onClick={handleReset}
                        >
                            Reset
                        </button>
                        <div className="flex-1" />
                        <button
                            disabled={pdfInfo === ""}
                            className="font-bold px-6 py-3 bg-blue-200 not:disabled:hover:bg-blue-300 disabled:bg-slate-100 cursor-pointer text-blue-700 disabled:text-slate-400 rounded-md mx-auto disabled:cursor-not-allowed"
                            onClick={handleSave}
                        >
                            Download
                        </button>
                    </div>
                    <div className="w-full h-[40rem] mt-8 rounded-lg p-4 bg-slate-100 overflow-y-auto shadow-lg">
                        <Document
                            inputRef={documentRef}
                            className="text-center relative smol-scrollbar"
                            file={pdfInfo}
                            onLoadSuccess={onDocumentLoadSuccess}
                            options={{
                                standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts`,
                                textLayerMode: 0,
                            }}
                        >
                            <div
                                id="signature"
                                className={`z-20 box-content ${
                                    signatureFocused
                                        ? "outline-4 outline-dashed outline-red-500"
                                        : ""
                                } absolute left-10 top-10 w-[400px] h-[240px] ${
                                    isSignatureVisible
                                        ? "visible pointer-events-auto opacity-100"
                                        : "invisible pointer-events-none opacity-0"
                                }`}
                                ref={signatureRef}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSignatureFocus(true);
                                }}
                            >
                                <img
                                    className="w-full h-full object-contain"
                                    src={signature}
                                />
                            </div>
                            <Page
                                pageNumber={currentPageNumber}
                                scale={1.5}
                                renderTextLayer={false}
                            />
                        </Document>
                    </div>
                    {pdfInfo !== "" && (
                        <div className="flex gap-4 items-center my-4 w-[fit-content] mx-auto">
                            <button
                                className="font-bold px-6 py-3 bg-sky-200 hover:bg-sky-300 cursor-pointer text-sky-700 rounded-md mx-auto"
                                onClick={handlePrevPage}
                            >
                                Prev
                            </button>
                            <div className="py-3 px-6 font-bold bg-slate-200 rounded-md">
                                {currentPageNumber}
                            </div>
                            <button
                                className="font-bold px-6 py-3 bg-sky-200 hover:bg-sky-300 cursor-pointer text-sky-700 rounded-md mx-auto"
                                onClick={handleNextPage}
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
