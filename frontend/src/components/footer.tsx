import { Link } from "@heroui/react";
import { Heart } from "lucide-react";

export const Footer = () => {
    return (
        <footer className="w-full py-6 mt-auto">
            <div className="flex flex-col items-center justify-center gap-2 text-sm text-default-400">
                <div className="flex items-center gap-1">
                    <span>Developed with</span>
                    <Heart className="fill-danger text-danger animate-pulse" size={16} />
                    <span>by</span>
                    <Link
                        isExternal
                        className="text-default-500 font-semibold hover:text-primary transition-colors underline-offset-4"
                        href="#"
                        color="foreground"
                    >
                        Swastik
                    </Link>
                </div>
            </div>
        </footer>
    );
};
