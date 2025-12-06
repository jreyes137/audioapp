"use client";

import { ReactNode } from "react";
import { ProjectsProvider } from "@/context/ProjectsContext";

interface ProvidersProps {
    children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
    return (
        <ProjectsProvider>
            {children}
        </ProjectsProvider>
    );
}

