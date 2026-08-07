import styles from "./index.module.css";
import type { ButtonProps } from "./index.types.js";

/**
 * Primary interactive button.
 * @param props Button props.
 * @returns Button element.
 */
export function Button({
  children,
  variant = "secondary",
  size = "md",
  className,
  type = "button",
  ...rest
}: ButtonProps) {
  const classes = [styles.button, styles[variant], styles[size], className]
    .filter(Boolean)
    .join(" ");

  return (
    <button className={classes} type={type} {...rest}>
      {children}
    </button>
  );
}
