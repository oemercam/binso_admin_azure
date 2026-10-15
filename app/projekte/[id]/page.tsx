import {ProjectDetail} from '@/components/pages/projects';
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;return <ProjectDetail key={id} id={id}/>}
