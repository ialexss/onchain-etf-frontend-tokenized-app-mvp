"use client";

import { useAuth } from "@/lib/auth/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Header } from "@/components/layout/header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const { user, isLoading } = useAuth();
	const router = useRouter();

	useEffect(() => {
		if (!isLoading && !user) {
			router.push("/login");
		}
	}, [user, isLoading, router]);

	if (isLoading) {
		return (
			<div className="flex h-screen items-center justify-center">
				<div className="space-y-4 w-full max-w-md">
					<Skeleton className="h-12 w-full" />
					<Skeleton className="h-32 w-full" />
					<Skeleton className="h-32 w-full" />
				</div>
			</div>
		);
	}

	if (!user) {
		return (
			<div className="flex h-screen items-center justify-center">
				<div className="text-center">
					<p className="text-slate-500">Redirigiendo al login...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="flex h-screen overflow-hidden">
			<div className="hidden md:flex md:w-64">
				<AppSidebar />
			</div>
			<div className="flex flex-1 flex-col overflow-hidden">
				<Header />
				<main className="flex-1 overflow-y-auto bg-slate-100 p-4 md:p-6 dark:bg-neutral-950">
					{children}
				</main>
			</div>
		</div>
	);
}
