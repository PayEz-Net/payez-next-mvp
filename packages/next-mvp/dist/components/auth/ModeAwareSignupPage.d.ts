import { FederatedProvider } from '@/types/auth';
interface Props {
    onFederatedSignUp?: (provider: FederatedProvider) => void;
    onTraditionalSignUp?: (email: string, password: string, confirmPassword: string) => Promise<void>;
    isLoading?: boolean;
    error?: string | null;
}
export declare function ModeAwareSignupPage({ onFederatedSignUp, onTraditionalSignUp, isLoading, error, }: Props): import("react/jsx-runtime").JSX.Element;
export {};
