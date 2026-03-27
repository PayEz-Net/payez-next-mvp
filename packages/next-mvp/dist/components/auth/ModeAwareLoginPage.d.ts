import { FederatedProvider } from '@/types/auth';
interface Props {
    onFederatedSignIn?: (provider: FederatedProvider) => void;
    onTraditionalSignIn?: (email: string, password: string) => Promise<void>;
    onForgotPassword?: () => void;
    isLoading?: boolean;
    error?: string | null;
}
export declare function ModeAwareLoginPage({ onFederatedSignIn, onTraditionalSignIn, onForgotPassword, isLoading, error, }: Props): import("react/jsx-runtime").JSX.Element;
export {};
