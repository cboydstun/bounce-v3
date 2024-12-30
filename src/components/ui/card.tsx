import * as React from "react";

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>((props, ref) => {
  const { className, ...other } = props;
  return (
    <div
      ref={ref}
      className={`rounded-lg border bg-card text-card-foreground shadow-sm ${
        className || ""
      }`}
      {...other}
    />
  );
});
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>((props, ref) => {
  const { className, ...other } = props;
  return (
    <div
      ref={ref}
      className={`flex flex-col space-y-1.5 p-6 ${className || ""}`}
      {...other}
    />
  );
});
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>((props, ref) => {
  const { className, ...other } = props;
  return (
    <h3
      ref={ref}
      className={`text-2xl font-semibold leading-none tracking-tight ${
        className || ""
      }`}
      {...other}
    />
  );
});
CardTitle.displayName = "CardTitle";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>((props, ref) => {
  const { className, ...other } = props;
  return (
    <div ref={ref} className={`p-6 pt-0 ${className || ""}`} {...other} />
  );
});
CardContent.displayName = "CardContent";

export { Card, CardHeader, CardTitle, CardContent };
