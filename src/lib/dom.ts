type Child = Node | string | null | false | undefined;

type Props = { className?: string; title?: string; onClick?: () => void };

export function el<K extends keyof HTMLElementTagNameMap>(tag: K, props: Props = {}, ...children: Child[]): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (props.className) node.className = props.className;
  if (props.title) node.title = props.title;
  if (props.onClick) node.addEventListener("click", props.onClick);
  for (const child of children) if (child) node.append(child);
  return node;
}
