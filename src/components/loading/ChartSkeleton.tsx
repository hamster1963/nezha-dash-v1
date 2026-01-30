export default function ChartSkeleton() {
	return (
		<div className="h-[130px] w-full px-6 py-3">
			<div className="relative h-full w-full animate-pulse">
				<div className="absolute bottom-0 left-0 right-0 h-px bg-muted-foreground/20" />
				<div className="absolute bottom-1 left-0 right-0 flex items-end justify-between gap-1 px-2">
					<div
						className="w-2 bg-muted-foreground/20 rounded-t"
						style={{ height: "40%" }}
					/>
					<div
						className="w-2 bg-muted-foreground/30 rounded-t"
						style={{ height: "65%" }}
					/>
					<div
						className="w-2 bg-muted-foreground/25 rounded-t"
						style={{ height: "45%" }}
					/>
					<div
						className="w-2 bg-muted-foreground/35 rounded-t"
						style={{ height: "80%" }}
					/>
					<div
						className="w-2 bg-muted-foreground/20 rounded-t"
						style={{ height: "55%" }}
					/>
					<div
						className="w-2 bg-muted-foreground/30 rounded-t"
						style={{ height: "70%" }}
					/>
					<div
						className="w-2 bg-muted-foreground/25 rounded-t"
						style={{ height: "50%" }}
					/>
					<div
						className="w-2 bg-muted-foreground/20 rounded-t"
						style={{ height: "35%" }}
					/>
					<div
						className="w-2 bg-muted-foreground/30 rounded-t"
						style={{ height: "60%" }}
					/>
					<div
						className="w-2 bg-muted-foreground/25 rounded-t"
						style={{ height: "45%" }}
					/>
					<div
						className="w-2 bg-muted-foreground/35 rounded-t"
						style={{ height: "75%" }}
					/>
					<div
						className="w-2 bg-muted-foreground/20 rounded-t"
						style={{ height: "55%" }}
					/>
				</div>
				<div className="absolute inset-0 bg-gradient-to-t from-background/20 via-transparent to-background/10 rounded-md" />
			</div>
		</div>
	);
}
