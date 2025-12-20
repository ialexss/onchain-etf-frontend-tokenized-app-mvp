"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";

export default function HomePage() {
	const router = useRouter();
	const { user, isLoading } = useAuth();

	useEffect(() => {
		if (!isLoading) {
			if (user) {
				router.push("/dashboard/overview");
			} else {
				router.push("/login");
			}
		}
	}, [user, isLoading, router]);

	return (
		<div className="flex h-screen items-center justify-center">
			<div className="text-center">
				<h1 className="text-2xl font-bold mb-2">ONCHAIN ETF APP</h1>
				<p className="text-slate-500">Cargando...</p>
			</div>
		</div>
	);
}
