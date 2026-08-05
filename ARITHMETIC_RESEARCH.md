# Arithmetic Item Bank: Evidence and Norming Plan

## Scope

This application is an original mental-arithmetic assessment inspired by the public structure of the Wechsler Arithmetic subtest. It is not a WAIS-IV or WAIS-5 administration, and its items and scores are not interchangeable with either edition.

The bank deliberately does not reproduce protected WAIS item wording or proprietary raw-to-scaled-score tables.

## Publicly Supported Design Features

- A peer-reviewed item-response analysis describes WAIS-IV Arithmetic as 22 dichotomously scored items in the Working Memory domain. It also describes easy start items and increasing item difficulty: <https://pmc.ncbi.nlm.nih.gov/articles/PMC8297006/>
- A clinical assessment reference describes orally presented word problems of increasing difficulty, a 30-second limit, and demands on working memory, quantitative reasoning, and mental manipulation. It also notes that education and mathematics anxiety can affect performance: <https://www.taylorfrancis.com/chapters/edit/10.1201/9781003309604-19/wais-iv-arithmetic-christina-nunez>
- Pearson's WAIS-5 score-entry documentation gives Arithmetic a total raw-score range of 0 to 25 and states that standard scores use age-based norms for ages 16:0 through 90:11: <https://qglobal.pearsonclinical.com/qg/static/Product/fr_ca/WAIS-5/WAIS-5_Enter_Scores.htm>
- Pearson's WAIS-5 overview shows Arithmetic as a secondary Fluid Reasoning subtest, rather than a primary Working Memory subtest: <https://www.pearsonclinical.asia/content/dam/school/global/clinical/asia/assets/wais-5/wais-5-overview-brochure.pdf>
- Pearson's sample WAIS-5 score report displays raw score, age-normed scaled score, percentile rank, reference-group score, and standard error of measurement. The example conversions are illustrative cases, not a reusable norm table: <https://www.pearsonassessments.com/content/dam/school/global/clinical/us/assets/wais-5/wais-5-sample-score-report-with-demographically-referenced-scores.pdf>
- The WAIS-5 standardization sample contained 2,020 people ages 16 through 90 and was stratified to 2022 US population characteristics. Public reporting describes 180 participants per younger age band and 100 per age band from 70 through 90: <https://pmc.ncbi.nlm.nih.gov/articles/PMC11595985/>
- Pearson's WAIS-5 product page confirms the age range, updated norms, and individually administered clinical purpose: <https://www.pearsonassessments.com/en-us/Store/ProfessionalAssessments/Cognition-%26-Neuro/Wechsler-Adult-Intelligence-Scale-%7C-FifthEdition/p/P100071002>

## Why No Public WAIS Norm Was Imported

No legitimate public source located in this review provides the complete, age-specific Arithmetic raw-to-scaled conversion tables or item-level WAIS-IV/WAIS-5 norms. Those materials are part of the publisher's restricted manuals and scoring systems.

A raw score from this app cannot be converted with a WAIS table anyway. The wording, item parameters, administration details, selection design, and bank composition differ. A formula that assumes a raw mean and standard deviation and then labels the result as a WAIS scaled score or IQ would create false precision.

## Implemented Bank

- 80 original item models: 20 in each of four tiers.
- 12 deterministic variants per model, for 960 stable item IDs.
- 22 questions per session: 4 very easy, 6 easy, 8 medium, and 4 semi-hard.
- A 30-second response limit and one optional repeat per item.
- Progressive ordering by tier and within-tier design difficulty.
- Local exposure balancing chooses the least-used item models and exact variants first.
- Stable model and variant IDs permit item-family calibration while keeping exact-question overlap low.

The generation code is versioned. Any change that can alter prompt text, answers, or item parameters requires a new bank version so historical observations are not silently combined.

## Calibration Strategy

### Phase 1: Content and Software QA

Use expert review plus automated checks before interpreting performance. Verify every answer, spoken rendering, time limit, input tolerance, tier assignment, and generated variant. Remove ambiguous or culturally narrow wording.

### Phase 2: Pilot Item Models

Treat the 80 models, not all 960 variants, as the first calibration units. Automatically generated variants share structure and are not statistically independent. Estimate model accuracy, response time, repeat use, timeout rate, and variant residuals.

Collect at least 50 observations per model before making basic keep/revise decisions. This is a pilot threshold, not a norm-quality threshold.

### Phase 3: IRT and Form Equating

For dichotomous responses, begin with Rasch/1PL and 2PL comparisons at the model level. Add explanatory predictors such as tier, operation count, working-memory load, and variant features. A hierarchical model is preferable when many variants have sparse exposure.

Published practical guidance reports that, under favorable conditions, at least 500 examinees and 20 or more items can yield reasonably accurate 2PL estimates, with accuracy improving as sample size increases: <https://onlinelibrary.wiley.com/doi/full/10.1002/ets2.12376>

Automatic item-generation research supports using explicit item models and psychometric evaluation rather than assuming cloned items are equivalent: <https://doi.org/10.1080/15305058.2011.635830>

Use 500 distinct participants as a minimum model-calibration milestone and 1,000 or more as the preferred initial target. Do not publish item-level parameters for variants with sparse observations.

### Phase 4: Age-Referenced Norms

Build age-referenced norms only from a deliberately recruited, representative sample. A large self-selected web sample is not automatically representative.

Track readiness in these age bands: 16-17, 18-19, 20-24, 25-29, 30-34, 35-44, 45-54, 55-64, 65-69, 70-74, 75-79, 80-84, and 85-90. Aim for at least 100 participants per band, with 180 per band preferred where feasible, while balancing sex, education, race/ethnicity, and region against the intended population.

Create raw-score empirical percentiles within age bands first. Only derive a mean-10, SD-3 scaled score after the sampling plan, weighting, form equating, reliability, model fit, differential item functioning, and score precision have been reviewed by a qualified psychometrician.

Do not label a single Arithmetic score as IQ. At most, report an age-referenced Arithmetic scaled score after calibration. Full-scale or working-memory IQ requires a separately validated multi-subtest composite.

## Retest Analysis

The app records an anonymous persistent participant ID, session ID, prior local session count, exact item ID, item-model ID, response time, timeout, skip, repeat, age, CAIT WMI, and CORE WMI. These fields permit mixed-effects analysis of:

- exact-item exposure effects;
- item-model exposure effects;
- session-number practice effects;
- response-time changes;
- correlations with external WMI scores;
- age and model interactions.

The participant ID is random and stored only in the browser. It is not a guarantee that two sessions came from different people or that the same person will retain the same ID across devices or after clearing storage.

## Reporting Rules Before Norms Are Ready

- Report raw correct out of 22, accuracy, average response time, repeats, and tier accuracy.
- Mark the score as uncalibrated.
- Do not display an IQ, WAIS-equivalent scaled score, percentile, or clinical classification.
- Publish sample size, recruitment source, age-band counts, exclusions, missingness, and uncertainty with any future norms.
