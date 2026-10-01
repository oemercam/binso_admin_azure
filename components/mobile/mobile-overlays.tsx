"use client";
import ResponsiveOverlay from "@/components/ui/responsive-overlay";

export function MobileQuickCreate({open,title,onClose,children}:{open:boolean;title:string;onClose:()=>void;children:React.ReactNode}){return <ResponsiveOverlay open={open} title={title} onClose={onClose} size="sm" className="mobile-quick-create-overlay">{children}</ResponsiveOverlay>}
export function MobileAccountPanel({open,title,onClose,children}:{open:boolean;title:string;onClose:()=>void;children:React.ReactNode}){return <ResponsiveOverlay open={open} title={title} onClose={onClose} size="sm" showHandle={true} className="mobile-account-overlay">{children}</ResponsiveOverlay>}
export function MobileNavigationPanel({open,title,onClose,children}:{open:boolean;title:string;onClose:()=>void;children:React.ReactNode}){return <ResponsiveOverlay open={open} title={title} onClose={onClose} size="md" showHandle={false} className="workspace-navigation-overlay">{children}</ResponsiveOverlay>}
