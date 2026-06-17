/** État exposé par Cover / Remix vers le dock générer unifié du dashboard. */
export type PanelGenerateBridge = {
  canSubmit: boolean;
  generating: boolean;
  submit: () => void;
  idleLabel: string;
  generatingLabel: string;
};
