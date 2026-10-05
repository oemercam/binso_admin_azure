-- Official Swiss QR-bill example account, exclusively in the isolated synthetic template.
select set_config('app.organization_id','00000000-0000-4000-8000-000000000099',true);
update organizations set legal_name='Binso Demo AG',street='Musterstrasse',building_number='7',postal_code='8000',city='Musterstadt',country_code='CH',iban='CH9300762011623852957'
where id='00000000-0000-4000-8000-000000000099' and is_demo=true;
