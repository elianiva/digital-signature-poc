export function dragMoveListener(event: DragEvent): { x: number; y: number } {
    if (event.target === null) return { x: 0, y: 0 };
    const target = event.target as HTMLDivElement;

    // keep the dragged position in the data-x/data-y attributes
    const x =
        // @ts-expect-error - no type
        (parseFloat(target.getAttribute("data-x") ?? "0") || 0) + event.dx;
    const y =
        // @ts-expect-error - no type
        (parseFloat(target.getAttribute("data-y") ?? "0") || 0) + event.dy;

    // translate the element
    target.style.transform = "translate(" + x + "px, " + y + "px)";

    // update the posiion attributes
    target.setAttribute("data-x", x);
    target.setAttribute("data-y", y);

    return { x, y };
}

export function resizeListener(event: any) {
    const target = event.target;
    let x = parseFloat(target.getAttribute("data-x")) || 0;
    let y = parseFloat(target.getAttribute("data-y")) || 0;

    // update the element's style
    target.style.width = event.rect.width + "px";
    target.style.height = event.rect.height + "px";

    // translate when resizing from top or left edges
    x += event.deltaRect.left;
    y += event.deltaRect.top;

    target.style.transform = "translate(" + x + "px," + y + "px)";

    target.setAttribute("data-x", x);
    target.setAttribute("data-y", y);
}
