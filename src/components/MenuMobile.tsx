import { Link, useLocation } from "react-router-dom";
import profilepic from "@/assets/drinks/male-avatar-cartoon.jpg";
import React, { useState } from "react";
import { MenuTabModel } from "../models/menu-tab-models";
import { getMenuTabs } from "./ReadData";

const MenuMobile = () => {
    const [menuTabs, setMenuTabs] = useState<MenuTabModel[]>([])

    React.useEffect(() => {
        setMenuTabs(getMenuTabs().filter(x => x.forMobile))
    }, [])

    const location = useLocation();
    const isActive = (href: string) => location.pathname === href;

    return (
        <>
            {/* Spacer per evitare che il contenuto finisca sotto la tabbar */}
            <div className="h-16 md:hidden" />

            {/* Bottom Tab Bar */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-background/95 backdrop-blur-sm">
                <div className="mx-auto max-w-lg">
                    <div className="grid grid-cols-5 items-center h-16 px-2">
                        {menuTabs.map(({ name, href, icon, isCenter, isProfile }) => {
                            const active = isActive(href);
                            const Icon = icon;

                            // Profile con avatar
                            if (isProfile) {
                                return (
                                    <Link
                                        key={name}
                                        to={href}
                                        aria-label={name}
                                        className="flex flex-col items-center justify-center gap-1"
                                    >
                                        <div
                                            className={[
                                                "w-8 h-8 rounded-full overflow-hidden",
                                                active ? "ring-2 ring-foreground" : "ring-1 ring-border",
                                            ].join(" ")}
                                        >
                                            <img
                                                src={profilepic}
                                                alt="User avatar"
                                                className="w-full h-full object-cover"
                                                draggable={false}
                                            />
                                        </div>
                                    </Link>
                                );
                            }

                            // Add centrale
                            if (isCenter) {
                                return (
                                    <Link
                                        key={name}
                                        to={href}
                                        aria-label={name}
                                        className="flex items-center justify-center"
                                    >
                                        <div
                                            className={[
                                                "w-12 h-12 rounded-2xl flex items-center justify-center",
                                                active
                                                    ? "bg-foreground text-background"
                                                    : "bg-foreground/10 text-foreground",
                                            ].join(" ")}
                                        >
                                            <Icon className="w-6 h-6" />
                                        </div>
                                    </Link>
                                );
                            }

                            // Tab normali
                            return (
                                <Link
                                    key={name}
                                    to={href}
                                    aria-label={name}
                                    className="flex flex-col items-center justify-center gap-1"
                                >
                                    <Icon
                                        className={[
                                            "w-6 h-6 transition-colors",
                                            active ? "text-foreground" : "text-foreground/60",
                                        ].join(" ")}
                                    />
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </nav>
        </>
    );
};

export default MenuMobile;
