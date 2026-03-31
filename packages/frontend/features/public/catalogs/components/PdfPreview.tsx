"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// ✅ DOĞRU WORKER (Next 16 uyumlu)
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
).toString();

export function PdfPreview({ url }: { url: string }) {
    const file = useMemo(() => ({ url }), [url]);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [width, setWidth] = useState(0);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const observer = new ResizeObserver((entries) => {
            const nextWidth = Math.floor(entries[0]?.contentRect.width ?? 0);
            if (nextWidth > 0) setWidth(nextWidth);
        });

        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    return (
        <div ref={containerRef} className="w-full h-full overflow-hidden">
            {width > 0 && (
                <Document file={file} loading={null}>
                    <Page
                        pageNumber={1}
                        width={width}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                        className="!w-full !h-auto"
                    />
                </Document>
            )}
        </div>
    );
}
