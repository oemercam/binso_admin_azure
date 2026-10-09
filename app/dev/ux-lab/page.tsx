import {notFound} from "next/navigation";
import {UxLab} from "@/components/ux-lab";

export default function Page(){
 if(process.env.NODE_ENV!=="development")notFound();
 return <UxLab/>;
}
