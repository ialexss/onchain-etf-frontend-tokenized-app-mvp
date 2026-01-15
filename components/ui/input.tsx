import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
	// Si se pasa value, no permitir defaultValue (React controlled component)
	const { value, defaultValue, ...restProps } = props;

	// Determinar si es controlled o uncontrolled
	// Si 'value' está en props (incluso si es undefined), es controlled
	// Si no está 'value' pero hay 'defaultValue', es uncontrolled
	const isControlled = "value" in props;

	// Función helper para normalizar el valor
	const normalizeValue = (val: any): string | number => {
		// Si es null o undefined, retornar string vacío
		if (val === null || val === undefined) {
			return "";
		}
		// Si es NaN, retornar string vacío
		if (typeof val === "number" && isNaN(val)) {
			return "";
		}
		// Para inputs de tipo number, si es string vacío, mantenerlo
		if (type === "number" && val === "") {
			return "";
		}
		// Retornar el valor tal cual
		return val;
	};

	let inputProps;
	if (isControlled) {
		// Controlled: siempre pasar value (normalizar undefined/null/NaN a string vacío)
		inputProps = {
			...restProps,
			value: normalizeValue(value),
		};
	} else if (defaultValue !== undefined) {
		// Uncontrolled: usar defaultValue
		inputProps = {
			...restProps,
			defaultValue,
		};
	} else {
		// Ni value ni defaultValue: uncontrolled sin valor inicial
		inputProps = restProps;
	}

	return (
		<input
			type={type}
			data-slot="input"
			className={cn(
				"file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
				"focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
				"aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
				className
			)}
			{...inputProps}
		/>
	);
}

export { Input };
