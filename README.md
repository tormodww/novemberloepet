# novemberloepet
Novemberloepet Moss Mc

NB! Vær spesielt oppmerksom på å unngå problemer med "maximum depth problems"!

Formål

Dette repository inneholder web-appen for Novemberløpet. Nedenfor er en prioritert liste over funksjoner og forbedringer jeg ønsker at du skal utføre, samt foreslåtte commit-meldinger for hver oppgave (som bedt om).

Oppgaver og foreslåtte commit-meldinger

* De som sitter på post må kunne se hvem som er DNS, og de må kunne registrere hvem som bryter på sin post.
  - Forslag til commit-melding: feat(post-ui): vis DNS og la post-person registrere brudd

* Passord og begrensning til hvem som kan registrere på hvilke poster. Vurder en liten «veiviser» ved pålogging på mobil: først valg av etappe, deretter en side for å registrere for å redusere feilregistreringer av etappe.
  - Forslag til commit-melding: feat(auth): legg til etappe-seleksjon og post-begrensninger ved innlogging

* Lite testløp når vi har en løsning (små brukertester / QA-runde).
  - Forslag til commit-melding: chore(test): legg til testløp-sjekkliste og testinstruksjoner

* Eksportmuligheter til Excel (CSV/XLSX).
  - Forslag til commit-melding: feat(export): eksporter deltakerliste og resultater til CSV/XLSX

* Importmuligheter av deltagere (CSV-fil).
  - Forslag til commit-melding: feat(import): støtt CSV-import av deltagere

* Utsendelse av e-post med deltagerbekreftelser.
  - Forslag til commit-melding: feat(email): send bekreftelses-epost til deltakere

* Mulighet for å oppdatere Back4App basert på verdiene i applikasjonen (med advarsel om at dette vil overskrive alt i Back4App).
  - Forslag til commit-melding: feat(sync): legg til manuell sync til Back4App (med tydelig advarsel)

Bugs (status og forslag)

* ✅ ~~ser ikke ut til at registrering av starttid fungerer~~ - LØST
* ✅ ~~ser ikke ut til at registrering av slutttid fungerer~~ - LØST
* ✅ ~~sjekk om nedtrekksliste oppdateres~~ - LØST

Åpne/ikke-løste problemer:

1) Når jeg registrerer en sluttid så ser den ikke ut til å dukke opp i resultatlisten
   - Status: Åpen
   - Reproduksjon: Registrer en sluttid i `FinishTimeRegister` / tilsvarende registreringsside, gå til `Results` eller resultatvisning og bekreft at sluttiden ikke vises.
   - Forslag til feilsøking:
     1. Sjekk at sluttiden faktisk blir skrevet til deltakerobjektet i state/context og at API-kallet returnerer suksess.
     2. Sjekk at resultatlisten abonnerer på riktig data (context/props) og at komponenten re-rendres etter oppdatering.
     3. Verifiser at eventuelle filter- eller sorteringsregler i `Results` ikke skjuler deltakeren.
   - Forslag til commit-melding: fix(results): sørg for at slutttider lagres og oppdaterer resultatlisten

2) Hvis jeg erstatter en starttid med DNS og så fjerner DNS så står det fortsatt igjen en starttid
   - Status: Åpen
   - Reproduksjon: Sett starttid for deltaker, oppdater til DNS i registrerings-UI, deretter fjern DNS (tilbakestill). Observer at starttidsfeltet ikke blir tømt.
   - Forslag til feilsøking:
     1. Sjekk at DNS-staten og tid-feltene håndteres konsistent i UI og i lagringslaget (local state, context og API).
     2. Sørg for at fjerning av DNS eksplisitt nullstiller eller fjerner tilhørende tidsfelt både i klient og ved lagring til backend.
   - Forslag til commit-melding: fix(starttime): nullstill starttid når DNS fjernes

Annet

Hvis du ønsker at jeg skal implementere og pushe endringene for de åpne buggene, kan jeg gå videre og gjøre følgende (velg ett eller flere):

1. Lage en konkret reproduksjonstest og enhetstest for hver bug (Vitest + React Testing Library) og implementere fixene.
2. Implementere fixes direkte i koden, med håndfull små commits etter forslagene over.
3. Lage en kort sjekkliste for manuell QA / testløp.

Skriv hva du ønsker at jeg skal gjøre videre – jeg kan starte på implementasjon og tester med en gang.