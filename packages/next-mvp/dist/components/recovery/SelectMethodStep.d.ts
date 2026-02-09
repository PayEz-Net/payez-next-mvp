import { RecoverySession } from '../../types/recovery';
interface Props {
    session: RecoverySession;
    onSelectMethod: (method: 'email' | 'sms' | 'authenticator') => void;
    loading: boolean;
}
export declare function SelectMethodStep({ session, onSelectMethod, loading }: Props): import("react/jsx-runtime").JSX.Element;
export {};
