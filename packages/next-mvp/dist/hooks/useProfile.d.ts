export type ProfileResponse = {
    email: string;
    user_id?: string;
    first_name?: string;
    last_name?: string;
    full_name?: string;
    phone_number?: string;
    email_confirmed?: boolean;
    phone_confirmed?: boolean;
    two_factor_enabled?: boolean;
    roles?: string[];
    contact_information?: Record<string, any>;
    [key: string]: any;
};
export declare function useProfile(): any;
