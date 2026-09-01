const DATA_URL="data/estimator_curve.json";
const MIN_COMPARABLES=5;

const $=s=>document.querySelector(s);
const borough=$("#borough");
const units=$("#units");
const unitsOut=$("#units-output");
const buyers=$("#buyers");
const lockBuyers=$("#lock-buyers-to-units");
const down=$("#down-payment");
const rate=$("#interest-rate");
const term=$("#loan-term");
const msg=$("#form-message");

let data=[];

const money=new Intl.NumberFormat("en-US",{
  style:"currency",
  currency:"USD",
  maximumFractionDigits:0
});

const compact=new Intl.NumberFormat("en-US",{
  style:"currency",
  currency:"USD",
  notation:"compact",
  maximumFractionDigits:2
});

function clamp(v,min,max){
  return Math.min(Math.max(v,min),max);
}

function monthlyPI(principal,annualRate,years){
  if(principal<=0)return 0;
  const months=years*12;
  const monthlyRate=annualRate/100/12;
  if(monthlyRate===0)return principal/months;
  const factor=(1+monthlyRate)**months;
  return principal*(monthlyRate*factor)/(factor-1);
}

function getCurveRow(selectedBorough,n){
  const exact=data.find(
    x=>x.borough===selectedBorough && Number(x.residential_units)===n
  );

  if(exact && Number(exact.n_comparables)>=MIN_COMPARABLES){
    return {
      row:exact,
      fallback:false,
      exact:exact
    };
  }

  const all=data.find(
    x=>x.borough==="All Boroughs" && Number(x.residential_units)===n
  );

  if(all){
    return {
      row:all,
      fallback:selectedBorough!=="All Boroughs",
      exact:exact||null
    };
  }

  return {
    row:exact||null,
    fallback:false,
    exact:exact||null
  };
}

function setText(id,value){
  $(id).textContent=value;
}

function clearResults(message){
  [
    "#estimated-price",
    "#price-range",
    "#price-per-unit",
    "#down-payment-total",
    "#down-payment-person",
    "#mortgage-principal",
    "#monthly-mortgage",
    "#monthly-per-person",
    "#comparable-sales"
  ].forEach(id=>setText(id,"—"));

  setText("#unit-group-badge","No data");
  setText("#comparison-note",message);
}

function render(){
  const n=clamp(Math.round(Number(units.value)||20),5,100);
  units.value=n;
  unitsOut.textContent=n;

  let buyerCount;
  if(lockBuyers.checked){
    buyerCount=n;
    buyers.value=n;
    buyers.disabled=true;
  }else{
    buyers.disabled=false;
    buyerCount=clamp(Math.round(Number(buyers.value)||30),1,200);
    buyers.value=buyerCount;
  }

  const downPct=clamp(Number(down.value)||0,0,100);
  const annualRate=clamp(Number(rate.value)||0,0,25);
  const years=clamp(Math.round(Number(term.value)||30),1,50);

  if(!data.length){
    clearResults("Market data have not loaded yet.");
    return;
  }

  const comparison=getCurveRow(borough.value,n);

  if(!comparison.row){
    clearResults("No model estimate is available for this unit count.");
    return;
  }

  const row=comparison.row;
  const ppu=Number(row.predicted_price_per_unit);
  const p25=Number(row.p25_price_per_unit);
  const p75=Number(row.p75_price_per_unit);
  const nComparables=Number(row.n_comparables);

  if(![ppu,p25,p75].every(Number.isFinite)){
    clearResults("The selected model estimate contains incomplete pricing data.");
    return;
  }

  const price=n*ppu;
  const low=n*p25;
  const high=n*p75;
  const downTotal=price*downPct/100;
  const principal=Math.max(price-downTotal,0);
  const monthly=monthlyPI(principal,annualRate,years);

  setText("#estimated-price",compact.format(price));
  setText("#price-range",`${compact.format(low)} – ${compact.format(high)}`);
  setText("#price-per-unit",money.format(ppu));
  setText("#down-payment-total",compact.format(downTotal));
  setText("#down-payment-person",money.format(downTotal/buyerCount));
  setText("#mortgage-principal",compact.format(principal));
  setText("#monthly-mortgage",money.format(monthly));
  setText("#monthly-per-person",money.format(monthly/buyerCount));
  setText("#comparable-sales",Number.isFinite(nComparables)?nComparables.toLocaleString("en-US"):"—");

  setText(
    "#unit-group-badge",
    `${row.borough} · ${n} units`
  );

  if(comparison.fallback){
    const localCount=comparison.exact?Number(comparison.exact.n_comparables):0;
    msg.textContent=localCount>0
      ? `${borough.value} has only ${localCount} nearby comparable sales at this size, so the estimate uses the all-borough model.`
      : `There are too few nearby ${borough.value} comparable sales at this size, so the estimate uses the all-borough model.`;

    setText(
      "#comparison-note",
      `Smooth estimate from validated sales near ${n} residential units across all included boroughs.`
    );
  }else{
    msg.textContent="";
    setText(
      "#comparison-note",
      `Smooth estimate from validated ${row.borough} sales near ${n} residential units.`
    );
  }
}

document.querySelector("#estimator-form").addEventListener("input",render);
document.querySelector("#estimator-form").addEventListener("change",render);

fetch(DATA_URL,{cache:"no-store"})
  .then(r=>{
    if(!r.ok)throw new Error(`HTTP ${r.status}`);
    return r.json();
  })
  .then(j=>{
    if(!Array.isArray(j)||j.length===0){
      throw new Error("Estimator curve is empty.");
    }
    data=j;
    render();
  })
  .catch(e=>{
    console.error(e);
    clearResults(
      "Could not load data/estimator_curve.json. Generate it from R and confirm it is in the site's data folder."
    );
  });
