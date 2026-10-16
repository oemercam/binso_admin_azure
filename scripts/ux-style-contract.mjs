/** Validate real parsed declarations and their central root-token definitions. */
export function styleBindingErrors(rules,bindings){
 const errors=[];
 for(const binding of bindings){
  const owners=rules.filter(r=>r.file===binding.file&&r.selector===binding.selector&&r.context===binding.context);
  const declarations=owners.flatMap(r=>r.declarations).filter(d=>d.property===binding.property);
  if(declarations.length!==1||declarations[0].value!==`var(${binding.token})`)errors.push(`${binding.id}: ${binding.file} ${binding.selector} ${binding.property} must have one central ${binding.token} binding`);
  const definitions=rules.filter(r=>r.file==='app/design-system/theme.css'&&r.selector===':root'&&!r.context).flatMap(r=>r.declarations).filter(d=>d.property===binding.token);
  if(definitions.length!==1||definitions[0].value!==binding.value)errors.push(`${binding.id}: root token must equal the documented ${binding.value}`);
 }
 return errors;
}
