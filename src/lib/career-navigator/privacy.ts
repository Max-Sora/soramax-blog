export interface CareerNavigatorPrivacyDefaults {
	persistLocally: boolean;
	sendPrivateDataToAi: boolean;
	autoSubmitApplications: boolean;
}

/** Safe defaults for a no-account, local-first release. */
export const PRIVACY_DEFAULTS: CareerNavigatorPrivacyDefaults = {
	persistLocally: false,
	sendPrivateDataToAi: false,
	autoSubmitApplications: false,
};
