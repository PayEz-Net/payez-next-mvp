interface Props {
    code: string;
    setCode: (code: string) => void;
    onSubmit: () => void;
    onResend: () => void;
    loading: boolean;
    maskedDestination?: string;
}
export declare function VerifyCodeStep({ code, setCode, onSubmit, onResend, loading, maskedDestination }: Props): import("react/jsx-runtime").JSX.Element;
export {};
