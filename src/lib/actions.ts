export function followMouse(node: HTMLElement) {
    function update(e: MouseEvent) {
        node.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
    }
    window.addEventListener('mousemove', update);
    return {
        destroy() {
            window.removeEventListener('mousemove', update);
        }
    }
}
