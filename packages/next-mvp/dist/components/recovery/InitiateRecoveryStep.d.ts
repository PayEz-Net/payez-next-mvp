interface Props {
    email: string;
    setEmail: (email: string) => void;
    onSubmit: () => void;
    loading: boolean;
}
export declare function InitiateRecoveryStep({ email, setEmail, onSubmit, loading }: Props): import("react/jsx-runtime").JSX.Element;
export {};
