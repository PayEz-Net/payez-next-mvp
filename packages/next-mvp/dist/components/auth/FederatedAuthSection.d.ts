import { FederatedProvider } from '@/types/auth';
interface Props {
    providers: FederatedProvider[];
    onProviderClick: (provider: FederatedProvider) => void;
    isLoading?: boolean;
}
export declare function FederatedAuthSection({ providers, onProviderClick, isLoading }: Props): import("react/jsx-runtime").JSX.Element | null;
export {};
