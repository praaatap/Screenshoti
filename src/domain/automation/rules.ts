import type {SmartCategory} from '../organization/smartGrouping';

export interface AutomationRule {
  id: string;
  name: string;
  pattern: RegExp;
  targetCategory: SmartCategory;
}

export const DEFAULT_AUTOMATION_RULES: AutomationRule[] = [
  {
    id: 'shopping-currency',
    name: 'Shopping Currency Detector',
    pattern: /(₹|\$|usd|inr|price|subtotal|discount|checkout|order total)/i,
    targetCategory: 'shopping',
  },
  {
    id: 'receipt-detector',
    name: 'Receipt Detector',
    pattern: /(invoice|receipt|tax invoice|payment successful|transaction id)/i,
    targetCategory: 'receipt',
  },
  {
    id: 'code-detector',
    name: 'Code Detector',
    pattern: /(function|const |import |error:|exception|typescript|stack trace|api)/i,
    targetCategory: 'code',
  },
];

export const runAutomationRules = (
  textById: Record<string, string>,
  rules: AutomationRule[] = DEFAULT_AUTOMATION_RULES,
): Record<string, SmartCategory> => {
  const output: Record<string, SmartCategory> = {};

  Object.entries(textById).forEach(([id, text]) => {
    const match = rules.find((rule) => rule.pattern.test(text));
    if (match) {
      output[id] = match.targetCategory;
    }
  });

  return output;
};
