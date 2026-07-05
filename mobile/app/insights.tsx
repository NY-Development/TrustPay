import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Alert, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useVerificationHistory } from '@/src/hooks/useVerification';
import { Paths, File } from 'expo-file-system';
import * as Print from 'expo-print';

export default function Insights() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themePrimary = isDark ? '#3b82f6' : '#003ec7';

  const { data: historyRes, isLoading, refetch } = useVerificationHistory();
  const history = historyRes?.data || [];

  const [isExporting, setIsExporting] = React.useState(false);

  // Analytical derivations
  const analytics = React.useMemo(() => {
    const hourCounts: Record<number, number> = {};
    const providerRisks: Record<string, { total: number; bad: number }> = {};
    const providerShares: Record<string, number> = {};

    let totalSuccess = 0;
    let totalSecIssues = 0;

    history.forEach((record) => {
      try {
        const date = record.paymentDate ? new Date(record.paymentDate) : new Date(record.createdAt);
        const hour = date.getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      } catch (e) {}

      const provider = (record.provider || 'unknown').toLowerCase();
      providerShares[provider] = (providerShares[provider] || 0) + 1;

      if (!providerRisks[provider]) {
        providerRisks[provider] = { total: 0, bad: 0 };
      }
      providerRisks[provider].total++;

      const isFraud = record.verificationSummary?.severity === 'fraud_risk';
      const isDuplicate = record.verificationSummary?.severity === 'duplicate' || 
                          (record.rawResponse?.confirmationHistory && 
                            (record.rawResponse.confirmationHistory.confirmationCount > 1 || 
                             record.rawResponse.confirmationHistory.confirmedBefore === true));

      if (isFraud || isDuplicate) {
        providerRisks[provider].bad++;
        totalSecIssues++;
      }

      if (record.verified === true && record.status === 'completed') {
        totalSuccess++;
      }
    });

    let peakHour = -1;
    let peakCount = 0;
    Object.entries(hourCounts).forEach(([h, count]) => {
      if (count > peakCount) {
        peakCount = count;
        peakHour = parseInt(h);
      }
    });

    let peakHourStr = 'No data';
    if (peakHour !== -1) {
      const start = peakHour;
      const formatTime = (h: number) => {
        const ampm = h >= 12 ? 'PM' : 'AM';
        const displayH = h % 12 === 0 ? 12 : h % 12;
        return `${displayH} ${ampm}`;
      };
      peakHourStr = `${formatTime(start)} - ${formatTime((start + 1) % 24)}`;
    }

    let worstProvider = 'None';
    let maxRiskRate = 0;
    Object.entries(providerRisks).forEach(([p, stats]) => {
      const rate = stats.bad / stats.total;
      if (rate > maxRiskRate && stats.bad > 0) {
        maxRiskRate = rate;
        worstProvider = p;
      }
    });

    let topProvider = 'None';
    let maxShare = 0;
    Object.entries(providerShares).forEach(([p, count]) => {
      if (count > maxShare) {
        maxShare = count;
        topProvider = p;
      }
    });

    const suggestions: Array<{ title: string; desc: string; type: 'info' | 'warning' | 'security' }> = [];

    if (peakHour !== -1) {
      suggestions.push({
        title: 'High Volume Staffing',
        desc: `Verification counts surge around ${peakHourStr}. Ensure front-desk checkout staff are active during this hour range.`,
        type: 'info',
      });
    }

    if (worstProvider !== 'None') {
      suggestions.push({
        title: `Replay / Fraud Risk on ${worstProvider.toUpperCase()}`,
        desc: `About ${Math.round(maxRiskRate * 100)}% of transactions sent from ${worstProvider.toUpperCase()} flagged warnings. Remind staff to strictly inspect transaction dates.`,
        type: 'security',
      });
    } else if (history.length > 0) {
      suggestions.push({
        title: 'Clean Security Profile',
        desc: 'All recent verification transactions matched and settled safely with no replay attacks detected.',
        type: 'info',
      });
    }

    return { peakHourStr, worstProvider, topProvider, maxRiskRate, suggestions };
  }, [history]);

  /* =========================================================
     EXPORT UTILITIES (EXCEL / CSV MATRIX & NATIVE PDF PRINT)
  ========================================================= */
  
  // Helper executing the physical CSV generation logic
  const executeExcelExport = async (fileName: string) => {
    setIsExporting(true);
    try {
      const headers = ['Reference ID', 'Provider/Bank', 'Amount', 'Currency', 'Verification Status', 'Flag Severity', 'Creation Date'];
      const rows = history.map((rec) => [
        rec.referenceNumber || rec._id || '',
        (rec.provider || 'N/A').toUpperCase(),
        rec.amount || '0',
        rec.currency || 'ETB',
        rec.status || 'unknown',
        rec.verificationSummary?.severity || 'clear',
        rec.createdAt ? new Date(rec.createdAt).toLocaleString() : ''
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      const BOM = '\uFEFF';
      
      // Clean up inputs to prevent invalid characters in paths
      const safeName = fileName.replace(/[/\\?%*:|"<>\s]/g, '_');
      const fileUri = `${Paths.document.uri}/${safeName}.csv`;
      
      const file = new File(fileUri);
      file.create({ overwrite: true });
      file.write(BOM + csvContent, { encoding: 'utf8' });
      
      await Share.share({ url: fileUri, title: 'Export Audit Ledger' });
    } catch (err: any) {
      Alert.alert('Export Failed', err.message || 'Unable to build dynamic sheet structure.');
    } finally {
      setIsExporting(false);
    }
  };

  const exportToExcel = () => {
    if (history.length === 0) {
      Alert.alert('Empty Dataset', 'No active verification records found to export.');
      return;
    }

    // Requests file naming schema interactively
    Alert.prompt(
      'Export Excel Statement',
      'Enter a name for your CSV report:',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Export', 
          onPress: (name: any) => {
            const finalName = name && name.trim().length > 0 ? name.trim() : `TrustPay_Business_Insights_${Date.now()}`;
            executeExcelExport(finalName);
          }
        }
      ],
      'plain-text',
      `TrustPay_Business_Insights_${Date.now()}`
    );
  };

  // Helper executing physical PDF printing routines
  const executePdfExport = async (fileName: string) => {
    setIsExporting(true);
    try {
      const tableRowsHtml = history.map((rec) => `
        <tr>
          <td>${rec.referenceNumber || rec._id || 'N/A'}</td>
          <td style="text-transform: uppercase;">${rec.provider || 'N/A'}</td>
          <td>${rec.amount || '0'} ${rec.currency || 'ETB'}</td>
          <td><span class="badge ${rec.status === 'completed' ? 'success' : 'failed'}">${rec.status || 'unknown'}</span></td>
          <td>${rec.verificationSummary?.severity || 'clear'}</td>
          <td>${rec.createdAt ? new Date(rec.createdAt).toLocaleDateString() : 'N/A'}</td>
        </tr>
      `).join('');

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 30px; color: #333; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #003ec7; padding-bottom: 15px; margin-bottom: 30px; }
            .title { font-size: 24px; font-weight: bold; color: #003ec7; }
            .meta { font-size: 12px; color: #666; text-align: right; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background-color: #f8fafc; color: #475569; font-weight: 600; text-align: left; padding: 12px; font-size: 12px; border-bottom: 2px solid #e2e8f0; }
            td { padding: 12px; font-size: 12px; border-bottom: 1px solid #edf2f7; color: #334155; }
            tr:nth-child(even) { background-color: #fdfdfd; }
            .badge { padding: 4px 8px; font-size: 10px; font-weight: bold; text-transform: uppercase; border-radius: 4px; }
            .success { background-color: #dcfce7; color: #15803d; }
            .failed { background-color: #fee2e2; color: #b91c1c; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="title">TrustPay Business Settlement Report</div>
              <div style="font-size: 14px; margin-top: 5px; color: #475569;">Verification History Audit Data Ledger</div>
            </div>
            <div class="meta">
              <strong>Generated:</strong> ${new Date().toLocaleString()}<br>
              <strong>Total Records:</strong> ${history.length}
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Reference ID</th>
                <th>Channel/Bank</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Risk Profile</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              ${tableRowsHtml}
            </tbody>
          </table>
        </body>
        </html>
      `;

      // Generate the internal temporary print asset structure 
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      
      // Relocate or match file location based on user custom file choice strings
      const safeName = fileName.replace(/[/\\?%*:|"<>\s]/g, '_');
      const targetUri = `${Paths.document.uri}/${safeName}.pdf`;
      
      const file = new File(targetUri);
      const originFile = new File(uri);
      
      originFile.copy(file);
      
      await Share.share({ url: targetUri, title: 'Export Business PDF Summary' });
    } catch (err: any) {
      Alert.alert('PDF Construction Failed', err.message || 'System ran out of assets.');
    } finally {
      setIsExporting(false);
    }
  };

  const exportToPdf = () => {
    if (history.length === 0) {
      Alert.alert('Empty Dataset', 'No active data ledger points available to generate PDF layout.');
      return;
    }

    // Requests file naming schema interactively
    Alert.prompt(
      'Export PDF Statement',
      'Enter a name for your PDF report:',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Export', 
          onPress: (name: any) => {
            const finalName = name && name.trim().length > 0 ? name.trim() : `TrustPay_Business_Report_${Date.now()}`;
            executePdfExport(finalName);
          }
        }
      ],
      'plain-text',
      `TrustPay_Business_Report_${Date.now()}`
    );
  };

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header Block */}
        <View className="px-6 py-4 flex-row items-center justify-between bg-card border-b border-border">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
              <Ionicons name="chevron-back" size={24} color={isDark ? 'white' : 'black'} />
            </TouchableOpacity>
            <Text className="text-foreground text-2xl font-bold">Business Insights</Text>
          </View>
          <TouchableOpacity
            onPress={() => refetch()}
            className="w-10 h-10 rounded-xl bg-muted items-center justify-center border border-border"
          >
            <Ionicons name="refresh" size={18} color={isDark ? 'white' : 'black'} />
          </TouchableOpacity>
        </View>

        <ScrollView
          className="flex-1 px-6 pt-6"
          contentContainerStyle={{ paddingBottom: 60 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={themePrimary} />
          }
        >
          {/* Export Command Tools Panel */}
          <View className="bg-card border border-border rounded-3xl p-5 mb-6 flex-row items-center justify-between shadow-xs">
            <View className="flex-1 pr-4">
              <Text className="text-foreground font-bold text-base">Export Statements</Text>
              <Text className="text-muted-foreground text-xs mt-0.5">Save clean, organized sheets or printable documents.</Text>
            </View>
            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={exportToExcel}
                disabled={isExporting}
                className="w-12 h-12 bg-green-500/10 border border-green-500/20 rounded-2xl items-center justify-center active:scale-95"
              >
                <Ionicons name="document-text" size={22} color="#22c55e" />
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={exportToPdf}
                disabled={isExporting}
                className="w-12 h-12 bg-red-500/10 border border-red-500/20 rounded-2xl items-center justify-center active:scale-95"
              >
                <Ionicons name="download" size={22} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Key Metrics Dashboard Row */}
          <Text className="text-foreground font-bold text-lg mb-3">Key Metrics</Text>
          <View className="flex-row flex-wrap justify-between mb-6">
            <View className="w-[48%] bg-card border border-border rounded-3xl p-5 mb-4 shadow-sm">
              <View className="bg-primary/10 w-10 h-10 rounded-xl items-center justify-center mb-3">
                <Ionicons name="time" size={20} color={themePrimary} />
              </View>
              <Text className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-1">Peak hour</Text>
              <Text className="text-foreground text-base font-bold flex-wrap">{analytics.peakHourStr}</Text>
            </View>

            <View className="w-[48%] bg-card border border-border rounded-3xl p-5 mb-4 shadow-sm">
              <View className="bg-green-500/10 w-10 h-10 rounded-xl items-center justify-center mb-3">
                <Ionicons name="business" size={20} color="#22c55e" />
              </View>
              <Text className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-1">Top Channel</Text>
              <Text className="text-foreground text-base font-bold uppercase">{analytics.topProvider}</Text>
            </View>

            <View className="w-full bg-card border border-border rounded-3xl p-5 shadow-sm">
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center">
                  <View className="bg-red-500/10 w-10 h-10 rounded-xl items-center justify-center mr-3">
                    <Ionicons name="shield-half-outline" size={20} color="#ef4444" />
                  </View>
                  <View>
                    <Text className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Risk Focus Hotspot</Text>
                    <Text className="text-foreground font-bold text-base uppercase mt-0.5">{analytics.worstProvider}</Text>
                  </View>
                </View>
                {analytics.worstProvider !== 'None' && (
                  <View className="bg-red-500/10 px-3 py-1 rounded-full">
                    <Text className="text-red-500 text-xs font-bold">{Math.round(analytics.maxRiskRate * 100)}% Alert Rate</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Mobile Ledger Data Table Engine Container */}
          <Text className="text-foreground font-bold text-lg mb-3">Live Verification Ledger</Text>
          <View className="bg-card border border-border rounded-3xl mb-6 overflow-hidden shadow-sm">
            <ScrollView horizontal showsHorizontalScrollIndicator={true}>
              <View>
                {/* Table Header */}
                <View className="bg-muted flex-row border-b border-border py-3 px-4">
                  <Text className="text-muted-foreground font-bold text-xs w-28">Reference ID</Text>
                  <Text className="text-muted-foreground font-bold text-xs w-20">Channel</Text>
                  <Text className="text-muted-foreground font-bold text-xs w-24">Amount</Text>
                  <Text className="text-muted-foreground font-bold text-xs w-20">Status</Text>
                </View>
                
                {/* Table Rows */}
                {history.length === 0 ? (
                  <View className="py-8 items-center justify-center w-[360px]">
                    <Text className="text-muted-foreground text-xs">No transactions compiled yet.</Text>
                  </View>
                ) : (
                  history.slice(0, 10).map((item, idx) => (
                    <View key={item._id || idx} className="flex-row border-b border-border/40 py-3.5 px-4 items-center">
                      <Text className="text-foreground text-xs font-medium w-28" numberOfLines={1} ellipsizeMode="middle">
                        {item.referenceNumber || item._id}
                      </Text>
                      <Text className="text-foreground text-xs uppercase font-semibold w-20">{item.provider || 'N/A'}</Text>
                      <Text className="text-foreground text-xs font-bold w-24">{item.amount || '0'} {item.currency || 'ETB'}</Text>
                      <View className="w-20">
                        <View className={`px-2 py-0.5 rounded-md self-start ${item.status === 'completed' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                          <Text className={`text-[10px] font-bold uppercase ${item.status === 'completed' ? 'text-green-500' : 'text-red-500'}`}>
                            {item.status || 'unknown'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))
                )}
              </View>
            </ScrollView>
            {history.length > 10 && (
              <View className="bg-muted/40 py-2 items-center border-t border-border">
                <Text className="text-muted-foreground text-[11px]">Showing latest 10 items. Use exports for complete history.</Text>
              </View>
            )}
          </View>

          {/* Recommendations Block */}
          <Text className="text-foreground font-bold text-lg mb-3">Recommendations & Suggestions</Text>
          <View className="space-y-4 gap-4">
            {analytics.suggestions.map((sug, i) => (
              <View
                key={i}
                className={`bg-card border rounded-3xl p-5 shadow-sm flex-row items-start ${
                  sug.type === 'security' ? 'border-red-500/20 bg-red-500/[0.02]' : 'border-border'
                }`}
              >
                <View className={`p-2.5 rounded-xl mr-4 ${sug.type === 'security' ? 'bg-red-500/10' : 'bg-primary/10'}`}>
                  <Ionicons
                    name={sug.type === 'security' ? 'shield-outline' : 'bulb-outline'}
                    size={22}
                    color={sug.type === 'security' ? '#ef4444' : themePrimary}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-foreground font-bold text-base">{sug.title}</Text>
                  <Text className="text-muted-foreground text-sm leading-6 mt-1">{sug.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Global Activity Loading Blocker Overlay */}
      {isExporting && (
        <View className="absolute inset-0 bg-black/40 items-center justify-center z-50">
          <View className="bg-card p-6 rounded-3xl border border-border items-center shadow-lg">
            <ActivityIndicator size="large" color={themePrimary} />
            <Text className="text-foreground font-bold mt-3 text-sm">Generating Statement...</Text>
          </View>
        </View>
      )}
    </View>
  );
}