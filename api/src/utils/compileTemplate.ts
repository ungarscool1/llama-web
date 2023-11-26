import Handlebars from 'handlebars';
import { Message, Role } from '../types/Message';

Handlebars.registerHelper("ifUser", function (this: Message, options) {
	if (this.role === Role.user) return options.fn(this);
});

Handlebars.registerHelper("ifAssistant", function (this: Message, options) {
	if (this.role === Role.assistant) return options.fn(this);
});


export default function compileTemplate(template: string, data: any): string {
  const compiledTemplate = Handlebars.compile(template, {
    noEscape: true,
    preventIndent: true,
    strict: true,
    knownHelpersOnly: true,
    knownHelpers: {
      ifUser: true,
      ifAssistant: true
    }
  });
  return compiledTemplate(data);
}