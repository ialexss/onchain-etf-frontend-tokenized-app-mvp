"use client";

import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

interface DocumentViewerProps {
	isOpen: boolean;
	onClose: () => void;
	url: string | null;
	title: string;
}

export function DocumentViewer({
	isOpen,
	onClose,
	url,
	title,
}: DocumentViewerProps) {
	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="max-w-4xl h-[80vh] flex flex-col">
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
				</DialogHeader>
				{url ? (
					<div className="flex-1 w-full h-full bg-muted/20 rounded-md overflow-hidden border">
						<iframe
							src={url}
							className="w-full h-full"
							title={title}
						/>
					</div>
				) : (
					<div className="flex-1 w-full h-full bg-muted/20 rounded-md overflow-hidden border flex items-center justify-center">
						<p className="text-muted-foreground">No hay documento disponible</p>
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}
