import { readFileSync } from 'fs';
import { join } from 'path';
import { z } from 'zod';
import {
  IReceiptPostProcessor,
  EnrichedReceiptAnalysis,
  ProcessorContext,
} from '../types.js';

/**
 * Schema for payee account mapping rule
 */
const PayeeAccountRuleSchema = z.object({
  payeePattern: z.string(),
  sourceAccount: z.string(),
  description: z.string().optional(),
});

/**
 * Schema for the payee account rules configuration file
 */
const PayeeAccountRulesConfigSchema = z.object({
  rules: z.array(PayeeAccountRuleSchema),
});

type PayeeAccountRule = z.infer<typeof PayeeAccountRuleSchema>;

interface CompiledRule {
  pattern: RegExp;
  sourceAccount: string;
  description?: string;
}

/**
 * Post-processor that maps payee names to source accounts based on regex rules.
 *
 * Rules are loaded from a configuration file and matched in order.
 * The first matching rule determines the source account.
 *
 * Configuration file format (config/payee-account-rules.json):
 * {
 *   "rules": [
 *     {
 *       "payeePattern": "K-Market|Prisma",
 *       "sourceAccount": "Assets:Bank:Checking",
 *       "description": "Optional description"
 *     }
 *   ]
 * }
 */
export class PayeeAccountMapperProcessor implements IReceiptPostProcessor {
  readonly name = 'PayeeAccountMapper';

  private rules: CompiledRule[] | null = null;
  private configPath: string;

  constructor(configPath?: string) {
    this.configPath =
      configPath ?? join(process.cwd(), 'config', 'payee-account-rules.json');
  }

  /**
   * Load and compile rules from configuration file.
   * Rules are cached after first load.
   */
  private loadRules(logger: ProcessorContext['logger']): CompiledRule[] {
    if (this.rules !== null) {
      return this.rules;
    }

    try {
      const configContent = readFileSync(this.configPath, 'utf-8');
      const parsed = JSON.parse(configContent);
      const validated = PayeeAccountRulesConfigSchema.parse(parsed);

      this.rules = validated.rules.map((rule: PayeeAccountRule) => ({
        pattern: new RegExp(rule.payeePattern, 'i'),
        sourceAccount: rule.sourceAccount,
        description: rule.description,
      }));

      logger.info(
        `${this.name}: Loaded ${this.rules.length} payee-account rules`
      );

      return this.rules;
    } catch (error) {
      if (
        error instanceof Error &&
        'code' in error &&
        error.code === 'ENOENT'
      ) {
        logger.warn(
          `${this.name}: Config file not found at ${this.configPath}, skipping payee-account mapping`
        );
      } else if (error instanceof z.ZodError) {
        logger.error(
          `${this.name}: Invalid config file format: ${error.message}`
        );
      } else if (error instanceof SyntaxError) {
        logger.error(
          `${this.name}: Invalid JSON in config file: ${error.message}`
        );
      } else {
        logger.error(`${this.name}: Failed to load config: ${error}`);
      }

      this.rules = [];
      return this.rules;
    }
  }

  async process(
    receipt: EnrichedReceiptAnalysis,
    context: ProcessorContext
  ): Promise<EnrichedReceiptAnalysis> {
    const rules = this.loadRules(context.logger);

    if (rules.length === 0) {
      return receipt;
    }

    const payee = receipt.payee;

    for (const rule of rules) {
      if (rule.pattern.test(payee)) {
        context.logger.info(
          `${this.name}: Matched payee "${payee}" to account "${rule.sourceAccount}"${
            rule.description ? ` (${rule.description})` : ''
          }`
        );

        return {
          ...receipt,
          sourceAccount: rule.sourceAccount,
        };
      }
    }

    context.logger.debug(
      `${this.name}: No matching rule found for payee "${payee}"`
    );

    return receipt;
  }
}
