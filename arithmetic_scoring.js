// Provisional scoring for the original 22-item arithmetic assessment.
// This is a research display model, not an official or age-normed WAIS conversion.

(function (root, factory) {
    root.ArithmeticScoring = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    const MODEL = Object.freeze({
        id: 'raw-z-v1',
        meanRaw: 15,
        rawSd: 3.5,
        iqMean: 100,
        iqSd: 15,
        minIq: 55,
        maxIq: 145,
    });

    function normalCdf(z) {
        if (z < -6) return 0;
        if (z > 6) return 1;

        const a1 = 0.254829592;
        const a2 = -0.284496736;
        const a3 = 1.421413741;
        const a4 = -1.453152027;
        const a5 = 1.061405429;
        const p = 0.3275911;
        const sign = z < 0 ? -1 : 1;
        const x = Math.abs(z) / Math.sqrt(2);
        const t = 1 / (1 + p * x);
        const erf = 1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
        return 0.5 * (1 + sign * erf);
    }

    function ordinal(value) {
        const n = Math.round(value);
        const mod100 = n % 100;
        if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
        if (n % 10 === 1) return `${n}st`;
        if (n % 10 === 2) return `${n}nd`;
        if (n % 10 === 3) return `${n}rd`;
        return `${n}th`;
    }

    function formatPercentile(percentile) {
        if (percentile < 1) return '<1st percentile';
        if (percentile > 99) return '>99th percentile';
        return `${ordinal(percentile)} percentile`;
    }

    function classifyIqEquivalent(iq) {
        if (iq >= 130) return 'Very High';
        if (iq >= 120) return 'High';
        if (iq >= 110) return 'High Average';
        if (iq >= 90) return 'Average';
        if (iq >= 80) return 'Low Average';
        if (iq >= 70) return 'Low';
        return 'Very Low';
    }

    function estimateIqEquivalent(rawScore) {
        if (!Number.isFinite(rawScore)) {
            throw new TypeError('rawScore must be a finite number');
        }

        const z = (rawScore - MODEL.meanRaw) / MODEL.rawSd;
        const unboundedIq = Math.round(MODEL.iqMean + z * MODEL.iqSd);
        const iqEstimate = Math.max(MODEL.minIq, Math.min(MODEL.maxIq, unboundedIq));
        const percentileEstimate = Math.max(0.1, Math.min(99.9, normalCdf(z) * 100));

        return {
            iqEstimate,
            percentileEstimate: Number(percentileEstimate.toFixed(1)),
            estimateClassification: classifyIqEquivalent(iqEstimate),
            estimateModel: MODEL.id,
            estimateMeanRaw: MODEL.meanRaw,
            estimateRawSd: MODEL.rawSd,
        };
    }

    return Object.freeze({
        MODEL,
        normalCdf,
        formatPercentile,
        classifyIqEquivalent,
        estimateIqEquivalent,
    });
});
