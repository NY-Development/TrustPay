// import React, { useState } from 'react';
// import { View, Text, FlatList, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { router } from 'expo-router';
// import { Ionicons } from '@expo/vector-icons';
// import { useColorScheme } from 'nativewind';
// import { useBusiness } from '../../src/hooks/useBusiness';

// export default function BusinessScreen() {
//   const { colorScheme } = useColorScheme();
//   const isDark = colorScheme === 'dark';
  
//   // Simulated Auth context value
//   const userBusinessId = "65c32109fb2e124f5a8a1234"; 

//   const { 
//     business, isBusinessLoading, businessError,
//     allBusinesses, isAllBusinessesLoading, allBusinessesError,
//     modifyBusiness, isUpdating 
//   } = useBusiness(userBusinessId);

//   const [newName, setNewName] = useState('');

//   const handleUpdate = async () => {
//     if (!newName.trim()) return;
//     try {
//       await modifyBusiness({ name: newName });
//       setNewName('');
//     } catch (e) {
//       console.error(e);
//     }
//   };

//   return (
//     <View className="flex-1 bg-background">
//       <SafeAreaView className="flex-1" edges={['top']}>
//         {/* Top Header Bar */}
//         <View className="px-6 h-14 flex-row items-center">
//           <TouchableOpacity 
//             onPress={() => router.back()}
//             className="w-10 h-10 rounded-xl bg-muted items-center justify-center border border-border"
//           >
//             <Ionicons name="arrow-back" size={20} color={isDark ? 'white' : 'black'} />
//           </TouchableOpacity>
//           <Text className="text-foreground text-xl font-bold ml-4">
//             {!userBusinessId ? 'Global Directory' : 'Business Settings'}
//           </Text>
//         </View>

//         {/* Super Admin Global Roster Layout */}
//         {!userBusinessId ? (
//           <View className="flex-1 px-6 pt-4">
//             {isAllBusinessesLoading ? (
//               <ActivityIndicator className="flex-1 justify-center items-center" size="large" />
//             ) : (
//               <>
//                 {allBusinessesError && (
//                   <Text className="text-destructive mb-3 font-medium">Error loading businesses.</Text>
//                 )}
//                 <FlatList
//                   data={allBusinesses}
//                   keyExtractor={(item) => item._id}
//                   showsVerticalScrollIndicator={false}
//                   contentContainerStyle={{ paddingBottom: 24 }}
//                   renderItem={({ item }) => (
//                     <View className="p-5 bg-card rounded-3xl mb-4 border border-border shadow-sm flex-row justify-between items-center">
//                       <View className="flex-1 pr-4">
//                         <Text className="text-lg font-bold text-foreground">{item.name}</Text>
//                         <Text className="text-sm text-muted-foreground mt-1">Industry: {item.industry}</Text>
//                       </View>
//                       <View className="px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
//                         <Text className="text-primary text-xs font-bold uppercase tracking-wider">
//                           {item.subscription?.tier}
//                         </Text>
//                       </View>
//                     </View>
//                   )}
//                 />
//               </>
//             )}
//           </View>
//         ) : (
//           /* Individual Business Profile Layout */
//           <View className="flex-1 px-6 pt-4">
//             {isBusinessLoading ? (
//               <ActivityIndicator className="flex-1 justify-center items-center" size="large" />
//             ) : (
//               <View className="flex-1">
//                 {businessError && (
//                   <Text className="text-destructive mb-3 font-medium">Error loading business profile.</Text>
//                 )}

//                 {business && (
//                   <View className="bg-card border border-border rounded-3xl p-6 mb-6 flex-row items-center">
//                     <View className="w-14 h-14 rounded-2xl bg-primary/10 items-center justify-center">
//                       <Ionicons name="business" size={24} color={isDark ? '#3b82f6' : '#003ec7'} />
//                     </View>
//                     <View className="ml-5 flex-1">
//                       <Text className="text-foreground text-xl font-bold">{business.name}</Text>
//                       <Text className="text-muted-foreground text-sm mt-0.5">Industry: {business.industry}</Text>
//                     </View>
//                     <View className="bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
//                       <Text className="text-primary text-xs font-bold uppercase tracking-wider">
//                         {business.subscription?.tier}
//                       </Text>
//                     </View>
//                   </View>
//                 )}

//                 <View className="p-6 bg-card rounded-3xl border border-border shadow-sm">
//                   <Text className="text-foreground text-lg font-bold mb-4">Modify Corporate Details</Text>
                  
//                   <View className="mb-5">
//                     <Text className="text-muted-foreground font-bold text-xs uppercase tracking-widest mb-2 ml-1">Business Name</Text>
//                     <TextInput
//                       className="h-14 border border-input rounded-2xl px-4 bg-background text-foreground text-base focus:border-primary"
//                       placeholder="Enter new corporate name"
//                       placeholderTextColor="#94a3b8"
//                       value={newName}
//                       onChangeText={setNewName}
//                     />
//                   </View>

//                   <TouchableOpacity 
//                     className={`h-14 rounded-2xl justify-center items-center ${isUpdating ? 'bg-muted' : 'bg-primary'} active:opacity-90`}
//                     onPress={handleUpdate}
//                     disabled={isUpdating}
//                   >
//                     <Text className={`font-bold text-base ${isUpdating ? 'text-muted-foreground' : 'text-primary-foreground'}`}>
//                       {isUpdating ? 'Saving Changes...' : 'Save Details'}
//                     </Text>
//                   </TouchableOpacity>
//                 </View>
//               </View>
//             )}
//           </View>
//         )}
//       </SafeAreaView>
//     </View>
//   );
// }

import { View, Text } from 'react-native'
import React from 'react'

type Props = {}

const business = (props: Props) => {
  return (
    <View>
      <Text>business</Text>
    </View>
  )
}

export default business