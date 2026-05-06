"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, LogOut } from "lucide-react";
import Image from "next/image";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Profile {
    name: string;
    email: string;
    avatar?: string;
    roleLabel?: string;
}

interface MenuItem {
    label: string;
    value?: string;
    onSelect?: () => void;
    icon: React.ReactNode;
}

interface ProfileDropdownProps extends React.HTMLAttributes<HTMLDivElement> {
    data: Profile;
    menuItems?: MenuItem[];
    signOutLabel?: string;
    onSignOut?: () => void;
}

export function ProfileDropdown({
    data,
    menuItems = [],
    signOutLabel = "Çıkış Yap",
    onSignOut,
    className,
    ...props
}: ProfileDropdownProps) {
    const [isOpen, setIsOpen] = React.useState(false);

    const initials = data.name?.slice(0, 2).toUpperCase() ?? "??"

    return (
        <div className={cn("relative", className)} {...props}>
            <DropdownMenu onOpenChange={setIsOpen}>
                <div className="group relative">
                    <DropdownMenuTrigger asChild>
                        <button
                            type="button"
                            className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/80 px-3 py-2.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all duration-200 hover:border-slate-300 hover:bg-white focus:outline-none"
                        >
                            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
                                {data.avatar ? (
                                    <Image
                                        src={data.avatar}
                                        alt={data.name}
                                        width={40}
                                        height={40}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-slate-600">
                                        {initials}
                                    </div>
                                )}
                            </div>

                            <div className="hidden min-w-0 text-left sm:block">
                                <div className="truncate text-sm font-medium leading-tight text-slate-900">
                                    {data.name}
                                </div>
                                <div className="mt-1 flex items-center gap-2">
                                    {data.roleLabel ? (
                                        <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                                            {data.roleLabel}
                                        </span>
                                    ) : null}
                                </div>
                            </div>

                            <ChevronDown
                                className={cn(
                                    "h-4 w-4 text-slate-400 transition-transform duration-200",
                                    isOpen && "rotate-180"
                                )}
                            />
                        </button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent
                        align="end"
                        sideOffset={4}
                        className="w-72 rounded-2xl border border-slate-200/80 bg-white/95 p-2 shadow-xl shadow-slate-900/5 backdrop-blur-sm
                    data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-top-right"
                    >
                        <div className="rounded-xl border border-slate-200/70 bg-slate-50/70 p-3">
                            <div className="flex items-center gap-3">
                                <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-white">
                                    {data.avatar ? (
                                        <Image
                                            src={data.avatar}
                                            alt={data.name}
                                            width={44}
                                            height={44}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-slate-600">
                                            {initials}
                                        </div>
                                    )}
                                </div>

                                <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-slate-900">
                                        {data.name}
                                    </p>
                                    <p className="truncate text-xs text-slate-500">
                                        {data.email}
                                    </p>
                                    {data.roleLabel ? (
                                        <span className="mt-2 inline-flex rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-600">
                                            {data.roleLabel}
                                        </span>
                                    ) : null}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1">
                            {menuItems.map((item) => (
                                <DropdownMenuItem key={item.label} asChild>
                                    <button
                                        type="button"
                                        onClick={item.onSelect}
                                        className="mt-2 flex items-center rounded-xl border border-transparent p-3 transition-all duration-200 hover:border-slate-200 hover:bg-slate-50 cursor-pointer group"
                                    >
                                        <div className="flex items-center gap-2 flex-1">
                                            {item.icon}
                                            <span className="whitespace-nowrap text-sm font-medium leading-tight text-slate-800 transition-colors group-hover:text-slate-950">
                                                {item.label}
                                            </span>
                                        </div>
                                        <div className="flex-shrink-0 ml-auto">
                                            {item.value && (
                                                <span
                                                    className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium tracking-tight text-slate-600"
                                                >
                                                    {item.value}
                                                </span>
                                            )}
                                        </div>
                                    </button>
                                </DropdownMenuItem>
                            ))}
                        </div>

                        <DropdownMenuSeparator className="my-3 bg-slate-200" />

                        <DropdownMenuItem asChild>
                            <button
                                type="button"
                                onClick={onSignOut}
                                className="flex w-full items-center gap-3 rounded-xl border border-transparent bg-rose-50 p-3 transition-all duration-200 hover:border-rose-200 hover:bg-rose-100 cursor-pointer group"
                            >
                                <LogOut className="h-4 w-4 text-rose-500 group-hover:text-rose-600" />
                                <span className="text-sm font-medium text-rose-600 group-hover:text-rose-700">
                                    {signOutLabel}
                                </span>
                            </button>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </div>
            </DropdownMenu>
        </div>
    );
}
