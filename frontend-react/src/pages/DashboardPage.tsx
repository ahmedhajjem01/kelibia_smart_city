import { resolveBackendUrl } from '../lib/backendUrl'
import { useEffect, useState } from 'react'

import { Link, useNavigate } from 'react-router-dom'

import { MapContainer, TileLayer, Marker, Popup, LayersControl, GeoJSON } from 'react-leaflet'

import L from 'leaflet'

import 'leaflet/dist/leaflet.css'

import { clearTokens, getAccessToken } from '../lib/authStorage'

import { useI18n } from '../i18n/LanguageProvider'

import MainLayout from '../components/MainLayout'



import markerIcon from 'leaflet/dist/images/marker-icon.png'

import markerShadow from 'leaflet/dist/images/marker-shadow.png'



const DefaultIcon = L.icon({ iconUrl: markerIcon, shadowUrl: markerShadow, iconSize: [25, 41], iconAnchor: [12, 41] })

L.Marker.prototype.options.icon = DefaultIcon



const KELIBIA_CENTER: [number, number] = [36.8474, 11.0991]

// Inverted mask: world rectangle with Kelibia hole — greys everything outside the commune
const KELIBIA_COORDS = [[11.0645414,36.8670169],[11.0656036,36.8678238],[11.0663223,36.8683731],[11.0666455,36.8687452],[11.0671619,36.8691477],[11.0661842,36.8699597],[11.0652857,36.8704384],[11.0653541,36.8704867],[11.0654935,36.8706069],[11.0677037,36.8721174],[11.0683179,36.8723899],[11.0669875,36.8744498],[11.0687042,36.8747244],[11.0672021,36.8757543],[11.0674596,36.8762693],[11.0682321,36.8763723],[11.0687471,36.8767842],[11.0710216,36.8765096],[11.071837,36.8766126],[11.0725236,36.8770245],[11.0730386,36.8776768],[11.0732317,36.8778398],[11.0730708,36.8782089],[11.0734141,36.8784663],[11.0732961,36.8787152],[11.0733605,36.8791872],[11.0733927,36.8796592],[11.073457,36.8800883],[11.073457,36.8804488],[11.0733497,36.880732],[11.073339,36.8811096],[11.0733819,36.8812726],[11.0732854,36.8814185],[11.0741544,36.8815129],[11.0752273,36.8813069],[11.0755921,36.8811525],[11.0767079,36.8811181],[11.0774589,36.8809808],[11.0785532,36.8806204],[11.0792613,36.8804831],[11.0801411,36.8803286],[11.0808921,36.8803286],[11.0813213,36.8805517],[11.0820294,36.8803801],[11.0826731,36.8805517],[11.0832739,36.8805517],[11.0836601,36.8806032],[11.0845185,36.8803629],[11.0850334,36.8802771],[11.085527,36.8797107],[11.0862994,36.8789555],[11.0869217,36.8781659],[11.087426,36.8774708],[11.0876942,36.8762006],[11.0882199,36.8745356],[11.0885954,36.8732826],[11.0887885,36.8725444],[11.08881,36.8720466],[11.0887778,36.8698494],[11.0885994,36.8683935],[11.0882775,36.86696],[11.0883097,36.8658099],[11.0884278,36.8651403],[11.088578,36.8643507],[11.0888328,36.8637605],[11.0893907,36.8639236],[11.0921507,36.8647949],[11.0922687,36.8645588],[11.0924672,36.8641489],[11.0925557,36.8640202],[11.0927112,36.8639022],[11.0931082,36.8636253],[11.0934971,36.8633678],[11.0936554,36.8631918],[11.0939933,36.8629086],[11.0942374,36.8627047],[11.0943823,36.862621],[11.0946049,36.8626275],[11.0946988,36.8626296],[11.0949107,36.8624987],[11.0954042,36.8621167],[11.0958789,36.8617154],[11.0962464,36.8614922],[11.0964583,36.8612969],[11.0968311,36.860975],[11.0970323,36.8607819],[11.0973407,36.8605201],[11.0978691,36.8602046],[11.0982232,36.8600651],[11.0986631,36.8600394],[11.0991861,36.8598634],[11.0995992,36.8597711],[11.1002749,36.8594787],[11.0994573,36.8570267],[11.0993321,36.8562224],[11.0992107,36.8557465],[11.0998829,36.8551132],[11.1017359,36.8558253],[11.1032066,36.8566013],[11.1047003,36.8534628],[11.105768,36.8535783],[11.1062372,36.8531446],[11.1070484,36.8535064],[11.1077395,36.8539811],[11.1093731,36.8544809],[11.1101858,36.8535771],[11.1105372,36.8532661],[11.1107357,36.8531889],[11.1108322,36.853146],[11.1112399,36.8536911],[11.1122377,36.855026],[11.1125542,36.8554639],[11.1124255,36.8557128],[11.1124201,36.8558158],[11.1127956,36.856082],[11.1130746,36.8562923],[11.1134447,36.8564425],[11.1136003,36.8559661],[11.1142977,36.8563052],[11.1146946,36.8560734],[11.1154885,36.8553179],[11.1161431,36.8557085],[11.1166848,36.8551676],[11.1172427,36.8553265],[11.1177684,36.8545968],[11.1180581,36.8548458],[11.11838,36.8544938],[11.1194958,36.8547771],[11.1206169,36.8540731],[11.1220331,36.8558416],[11.1235406,36.8573696],[11.1242218,36.858168],[11.1247315,36.857889],[11.1257453,36.8580306],[11.1271454,36.8573096],[11.1289099,36.8572798],[11.1295584,36.8572688],[11.1296606,36.8570742],[11.1300889,36.8560531],[11.1298108,36.8557206],[11.1298177,36.8553238],[11.12944,36.8549699],[11.128717,36.8550245],[11.1281374,36.8549322],[11.1279492,36.8548406],[11.1279134,36.8548232],[11.1272692,36.8541029],[11.1268942,36.8534548],[11.126376,36.8524139],[11.1262853,36.8521079],[11.126022,36.8512201],[11.12594,36.8507218],[11.1259758,36.8504294],[11.1260397,36.8502504],[11.1260544,36.8501669],[11.1259678,36.8499731],[11.1259361,36.8497748],[11.1260155,36.8495614],[11.1261236,36.8493738],[11.1261406,36.8493287],[11.1261958,36.8492794],[11.1262511,36.8491699],[11.1263163,36.8491207],[11.1263163,36.8490584],[11.1263214,36.8490202],[11.1264268,36.8489439],[11.1264648,36.8488677],[11.1264189,36.8488403],[11.1263562,36.848845],[11.126316,36.8488577],[11.1262871,36.8488085],[11.1262662,36.8487946],[11.1262043,36.8488436],[11.1261139,36.848918],[11.1260812,36.848924],[11.1260649,36.8489049],[11.1261289,36.8488255],[11.126144,36.8487944],[11.1261151,36.8487864],[11.12608,36.8488155],[11.1260523,36.8488034],[11.1260222,36.8488095],[11.126026,36.8488527],[11.1259243,36.848969],[11.125876,36.8489565],[11.1258551,36.8489115],[11.1258117,36.8488865],[11.1257385,36.848915],[11.1257059,36.8488718],[11.1256971,36.8487854],[11.125613,36.848713],[11.1255029,36.8486649],[11.1252444,36.8486133],[11.1249755,36.8485812],[11.124933,36.848565],[11.1248305,36.848526],[11.1247101,36.8484099],[11.1246862,36.8482404],[11.1242477,36.8476162],[11.1240956,36.8472848],[11.1240269,36.8470302],[11.1239744,36.8466027],[11.1240106,36.8465172],[11.1240676,36.8464402],[11.1245065,36.846434],[11.1246299,36.8464121],[11.1246559,36.8463412],[11.1245706,36.8463208],[11.1243531,36.8462818],[11.1241962,36.8462725],[11.1241584,36.8462101],[11.1242694,36.8461322],[11.1241525,36.8460609],[11.1238646,36.8460024],[11.1238187,36.8458197],[11.1240883,36.8455685],[11.1243864,36.8447924],[11.1240469,36.8442494],[11.1232614,36.8441437],[11.122559,36.8440784],[11.122416,36.8440136],[11.1223141,36.8439466],[11.1221094,36.8437483],[11.1219034,36.8435294],[11.1217975,36.8433894],[11.1217338,36.8432128],[11.1220213,36.8428926],[11.122055,36.8427927],[11.1220001,36.842643],[11.1215672,36.8422632],[11.1216948,36.8420765],[11.1219259,36.841769],[11.1219804,36.841509],[11.1219378,36.8411437],[11.1218393,36.8407956],[11.1216886,36.8405248],[11.1215593,36.840269],[11.1215003,36.8400084],[11.1214976,36.839781],[11.121441,36.8395191],[11.1213402,36.839318],[11.1210545,36.8389378],[11.1200494,36.8381914],[11.1196211,36.8366791],[11.1191882,36.8358393],[11.1165595,36.8333589],[11.1163774,36.8330964],[11.1162846,36.8330687],[11.1162898,36.8331393],[11.1164034,36.8333398],[11.1163814,36.8334208],[11.1163478,36.8334955],[11.1160016,36.8336237],[11.1159442,36.8335491],[11.1157409,36.8332847],[11.1156968,36.8332862],[11.1156152,36.833201],[11.1155498,36.8330933],[11.1151919,36.8327787],[11.1143342,36.8320725],[11.1141385,36.8320076],[11.1137402,36.8319138],[11.1134389,36.8318843],[11.1128758,36.8318969],[11.108647,36.8322297],[11.1075833,36.8323325],[11.1074207,36.8323646],[11.1073873,36.8324084],[11.1073851,36.832463],[11.1074032,36.8325027],[11.1074471,36.8325356],[11.1076045,36.8325128],[11.1076747,36.8325236],[11.107811,36.8325341],[11.1087715,36.8324496],[11.1088501,36.8324857],[11.1088911,36.8329437],[11.1088735,36.8329726],[11.1082986,36.8333685],[11.1082492,36.833393],[11.1082299,36.8334205],[11.1082396,36.83345],[11.1082709,36.8334811],[11.108299,36.8334974],[11.1083281,36.8334912],[11.1083888,36.8334352],[11.1084414,36.8333756],[11.1085205,36.833304],[11.1090516,36.8330027],[11.1090966,36.8329644],[11.1091195,36.8329033],[11.1091087,36.832838],[11.1096058,36.8328032],[11.1095823,36.8325354],[11.1109146,36.8324327],[11.1116069,36.8323854],[11.1117356,36.8323346],[11.1132576,36.8322292],[11.1139492,36.8324482],[11.1143503,36.8328119],[11.1135719,36.8333898],[11.1131571,36.8330387],[11.1129223,36.8332216],[11.1131285,36.8333779],[11.1130685,36.8334228],[11.1128602,36.8332679],[11.1128057,36.8333099],[11.1130165,36.833466],[11.1129937,36.8334882],[11.1130538,36.8335422],[11.1129962,36.8335957],[11.113425,36.8338983],[11.1134553,36.8338717],[11.1135596,36.8339488],[11.1134821,36.8341373],[11.113308,36.8345289],[11.1132039,36.8347445],[11.11197,36.8349304],[11.1117347,36.8339923],[11.111068,36.8341153],[11.1111601,36.8345398],[11.1106435,36.8346232],[11.1106647,36.8347043],[11.1106295,36.8347115],[11.1106222,36.8347129],[11.1105413,36.8347293],[11.110655,36.8354148],[11.1101846,36.8354862],[11.1099901,36.8346566],[11.1100715,36.8346414],[11.1099685,36.8341794],[11.1097496,36.8342031],[11.1097251,36.8341371],[11.109685,36.8338563],[11.109687,36.8338083],[11.1096703,36.8337821],[11.1096249,36.8337657],[11.1095847,36.8337726],[11.1095436,36.8338042],[11.1095283,36.8338323],[11.10955,36.8339095],[11.1095205,36.8339194],[11.1095122,36.8339341],[11.1095105,36.8339775],[11.1097401,36.8349138],[11.1099046,36.8355228],[11.1099569,36.8355627],[11.1101258,36.8362703],[11.1100639,36.8363379],[11.1093031,36.8367028],[11.1086722,36.8369444],[11.1083724,36.8370447],[11.1081132,36.8371131],[11.1078054,36.8371373],[11.1072827,36.8371759],[11.106758,36.8371934],[11.1065677,36.8371688],[11.1063401,36.8370738],[11.1062259,36.8371331],[11.1060472,36.837153],[11.1057366,36.8371514],[11.1055619,36.837225],[11.1052743,36.8372266],[11.1052524,36.83727],[11.1050344,36.8372329],[11.104801,36.8371683],[11.1045283,36.8371384],[11.1043903,36.8371063],[11.1041027,36.8369904],[11.103985,36.8369599],[11.1038439,36.8369534],[11.1035243,36.8368824],[11.1034157,36.836834],[11.1031513,36.8366942],[11.1030383,36.8366468],[11.1029305,36.8366329],[11.102791,36.8366329],[11.1020287,36.8364473],[11.1013825,36.8363534],[11.1013388,36.8363271],[11.1012915,36.8363169],[11.1011712,36.8363227],[11.1009729,36.8362938],[11.1008572,36.8362785],[11.1007372,36.8362903],[11.1005825,36.8363366],[11.1000823,36.83644],[11.0998418,36.8364897],[11.099639,36.836505],[11.0991735,36.8364878],[11.0991025,36.8364648],[11.0990752,36.8364241],[11.0988451,36.8363936],[11.0987738,36.836417],[11.0975305,36.8359911],[11.0962973,36.8350118],[11.0958643,36.8346541],[11.095529,36.8342776],[11.0948287,36.8337943],[11.0947609,36.8337738],[11.0943935,36.8334882],[11.0940678,36.833275],[11.0936582,36.8330597],[11.0928649,36.8326009],[11.0926886,36.8324799],[11.092377,36.8323162],[11.0921996,36.8322424],[11.0920733,36.8322185],[11.091811,36.8321833],[11.0915954,36.8321873],[11.0909984,36.8321648],[11.0907036,36.8321417],[11.0898663,36.8320496],[11.0896451,36.8320224],[11.0894325,36.8319657],[11.0892363,36.8318947],[11.0890661,36.8318006],[11.0880297,36.8314339],[11.0874466,36.8311978],[11.0871658,36.8310746],[11.0868824,36.8309381],[11.0866432,36.8308005],[11.0864015,36.8306185],[11.0854352,36.8299839],[11.0851278,36.8297815],[11.0849743,36.8296516],[11.0848193,36.8294916],[11.0845906,36.8292625],[11.0843748,36.8291026],[11.0840689,36.8288859],[11.0836669,36.8286561],[11.0832499,36.8283215],[11.082887,36.8280368],[11.0827497,36.8279386],[11.0825768,36.8278484],[11.081755,36.8274617],[11.0789393,36.8259401],[11.0770717,36.8247406],[11.076352,36.8243419],[11.0759765,36.8241183],[11.0757567,36.8239203],[11.0751156,36.8236894],[11.0746485,36.8235281],[11.0734945,36.8228609],[11.0727481,36.8224321],[11.072423,36.8221608],[11.0721665,36.8219995],[11.0718689,36.8219005],[11.0716216,36.8216659],[11.0711545,36.82138],[11.0705775,36.8210941],[11.0703165,36.8209254],[11.0701837,36.8208045],[11.0694739,36.8205222],[11.0690388,36.8202363],[11.0685488,36.8200236],[11.0683245,36.8198843],[11.0680451,36.819734],[11.06772,36.8195287],[11.0671384,36.8191695],[11.0666118,36.8187956],[11.0661813,36.8184033],[11.0656089,36.8180441],[11.064977,36.8176738],[11.0643313,36.8173585],[11.0637497,36.8170799],[11.0630353,36.8167866],[11.0626278,36.8166436],[11.062234,36.8165337],[11.0618445,36.8164019],[11.0610239,36.8160843],[11.0606091,36.8159435],[11.0603115,36.8158388],[11.0601431,36.8157543],[11.0600455,36.8157053],[11.0598065,36.8155934],[11.0596442,36.8154742],[11.0593922,36.8153286],[11.0591408,36.8151833],[11.0586221,36.8149866],[11.0580905,36.8147747],[11.0572716,36.8143572],[11.0564254,36.8139175],[11.0561856,36.8138311],[11.0559981,36.8137287],[11.0557221,36.8135243],[11.0550894,36.8130989],[11.0548171,36.812999],[11.0546621,36.8128992],[11.0543448,36.8126387],[11.053741,36.8121738],[11.0529423,36.8115169],[11.0524927,36.8112047],[11.0522551,36.8109571],[11.0518799,36.8107274],[11.0511675,36.8102437],[11.05064,36.809879],[11.0497995,36.8090626],[11.0495949,36.808925],[11.0492693,36.8086228],[11.0487327,36.8082401],[11.048115,36.8077419],[11.0477363,36.8075723],[11.0473665,36.8072185],[11.0471456,36.8070055],[11.0469878,36.806973],[11.0467037,36.8067997],[11.0464242,36.8065795],[11.0461446,36.8063448],[11.0459057,36.8061391],[11.0457118,36.8060127],[11.0455765,36.8058936],[11.0454458,36.8057564],[11.045324,36.8056481],[11.0451527,36.8055109],[11.0449272,36.8052907],[11.044562,36.8049947],[11.0443862,36.8047997],[11.0442058,36.8046084],[11.0439353,36.8043051],[11.0436512,36.8040235],[11.0434754,36.8037744],[11.0433401,36.8036336],[11.0431868,36.8034459],[11.04302,36.8031679],[11.0428351,36.8029368],[11.0426502,36.8026191],[11.0423887,36.8022978],[11.042106,36.8020576],[11.0418084,36.8019132],[11.0414973,36.8017832],[11.0411501,36.8016352],[11.040866,36.8015124],[11.0405324,36.8013283],[11.040343,36.8011911],[11.0399868,36.8009853],[11.0396531,36.8007687],[11.0393014,36.8004727],[11.038801,36.7999961],[11.0386071,36.7997361],[11.0383411,36.7995664],[11.0378073,36.7992234],[11.0364971,36.7985498],[11.0358879,36.7982541],[11.0354608,36.7980569],[11.0349995,36.7978271],[11.0341653,36.7973546],[11.0339266,36.7971785],[11.0338032,36.7970518],[11.0335511,36.7968499],[11.0332037,36.7966211],[11.0325814,36.797117],[11.0327424,36.7976454],[11.0327263,36.7980921],[11.0323669,36.7989556],[11.0320825,36.7993937],[11.0314603,36.8000122],[11.0308165,36.8006737],[11.0305698,36.8012064],[11.0297705,36.8019323],[11.028998,36.8024778],[11.0284884,36.8026625],[11.0279412,36.8018292],[11.0272331,36.8013481],[11.0266645,36.8010388],[11.025436,36.8007124],[11.0244758,36.8003559],[11.0239125,36.8000208],[11.0231079,36.7992219],[11.0206563,36.7968679],[11.0200716,36.797233],[11.0188646,36.7980879],[11.0176952,36.798715],[11.0166759,36.7991961],[11.0152812,36.7993765],[11.0145194,36.7996858],[11.0131998,36.8004676],[11.0126955,36.8010088],[11.0125882,36.8014813],[11.0120518,36.8019967],[11.0103566,36.8037406],[11.0086186,36.8051752],[11.0062462,36.806334],[11.006349,36.8070771],[11.0068148,36.8101201],[11.0070509,36.8118552],[11.0071367,36.8134013],[11.0070616,36.8158149],[11.007008,36.8178247],[11.0067934,36.8192848],[11.007008,36.8208823],[11.0072547,36.8219902],[11.007641,36.8233042],[11.0076195,36.8242361],[11.0078663,36.8251249],[11.0088426,36.8264303],[11.0109669,36.8292299],[11.0114068,36.8304322],[11.0112888,36.8323214],[11.0114068,36.8328968],[11.0141426,36.8360997],[11.0147435,36.8373362],[11.0143894,36.8395773],[11.0140246,36.8420244],[11.0136169,36.8446003],[11.0130483,36.8477684],[11.0139066,36.8500607],[11.0144001,36.8506273],[11.0156661,36.8515202],[11.0159558,36.8521812],[11.0158378,36.8524817],[11.0155159,36.8531771],[11.0151941,36.8542502],[11.0148829,36.8555894],[11.0145289,36.8566711],[11.0142499,36.8576583],[11.0135418,36.8585597],[11.0119218,36.8612036],[11.011911,36.8617787],[11.0114819,36.8622423],[11.0106558,36.8624054],[11.0102481,36.863444],[11.0107738,36.8638131],[11.0107201,36.8640964],[11.0101193,36.8647831],[11.0091108,36.8656758],[11.0088211,36.8662079],[11.0083276,36.8664139],[11.0076946,36.8673238],[11.0073084,36.8674439],[11.0055596,36.867607],[11.0047978,36.8675126],[11.004079,36.8676414],[11.0036606,36.8676585],[11.0030919,36.8676843],[11.0022122,36.8682508],[11.0016865,36.8684911],[11.0015255,36.8687229],[11.0008925,36.8694868],[11.0003883,36.8699502],[10.9994656,36.8706283],[10.9984893,36.8712205],[10.9978563,36.871272],[10.9968263,36.8718042],[10.996719,36.8721904],[10.9963435,36.8723535],[10.9959251,36.8725165],[10.9957534,36.8728341],[10.9947127,36.8735894],[10.9942514,36.8741816],[10.9941763,36.8748167],[10.9925562,36.8756063],[10.992364,36.875792],[10.9926608,36.8783842],[10.9938249,36.8789807],[10.9961101,36.8787747],[10.9982184,36.8796458],[10.9992322,36.8801307],[10.9999672,36.8804783],[11.0005251,36.8807185],[11.0011581,36.8813793],[11.0014317,36.8816754],[11.0022685,36.8831086],[11.0029283,36.8837007],[11.0039207,36.8839453],[11.0050687,36.8839796],[11.0053745,36.8840826],[11.0062543,36.8842714],[11.0074183,36.8847219],[11.009151,36.8853912],[11.0100737,36.8857345],[11.0113397,36.8862279],[11.0121873,36.8863609],[11.0136089,36.8870045],[11.014258,36.8863609],[11.0149607,36.8855371],[11.0159478,36.8844816],[11.0165271,36.8843615],[11.0173372,36.8842842],[11.0178736,36.8842027],[11.018237,36.8839807],[11.0185991,36.8838519],[11.0187292,36.8839517],[11.0187614,36.8841308],[11.0187399,36.8851863],[11.0183644,36.8860788],[11.0186005,36.8869026],[11.0185039,36.8874432],[11.0196841,36.8886875],[11.0200274,36.8892624],[11.0194802,36.889331],[11.0198611,36.8898287],[11.0202688,36.8903607],[11.0208428,36.8904208],[11.0221517,36.8904465],[11.0229456,36.8904165],[11.0237986,36.8902148],[11.0250056,36.889936],[11.0255796,36.8898802],[11.0262823,36.8897257],[11.027264,36.8894898],[11.0278702,36.8891294],[11.0283369,36.8891079],[11.0287714,36.8892366],[11.0291523,36.8891036],[11.0298014,36.8885544],[11.0305685,36.887795],[11.0314697,36.8873488],[11.0329074,36.8869798],[11.0335189,36.8865422],[11.0353857,36.8847315],[11.0361582,36.8837876],[11.0366839,36.8835215],[11.0380036,36.8824488],[11.0406214,36.8842252],[11.0422415,36.8854996],[11.0448472,36.8871761],[11.0452979,36.886687],[11.0455258,36.8864832],[11.0461816,36.8860327],[11.0462997,36.8858932],[11.0466604,36.8854738],[11.0469447,36.8852904],[11.0472974,36.8850909],[11.0485071,36.8843979],[11.0487244,36.8842585],[11.0489819,36.8840761],[11.0498362,36.8834604],[11.050384,36.883048],[11.0506931,36.8828559],[11.0513342,36.8825513],[11.0518652,36.8822617],[11.0521844,36.8820385],[11.0526029,36.8817232],[11.0534987,36.8810109],[11.0537991,36.8807105],[11.0538635,36.8805303],[11.0540378,36.8796936],[11.0542336,36.8793867],[11.0541559,36.8793503],[11.0538823,36.8792838],[11.0534236,36.8792065],[11.0529274,36.87911],[11.0523561,36.8790392],[11.0519457,36.8788826],[11.0511679,36.8785371],[11.0505134,36.8781187],[11.0503713,36.8782174],[11.0501191,36.8784964],[11.0499475,36.878565],[11.0497892,36.87858],[11.0496336,36.8785457],[11.0494995,36.8784298],[11.049572,36.8780973],[11.0494727,36.8777454],[11.0493064,36.8775909],[11.048939,36.8776103],[11.0488639,36.8773013],[11.0491964,36.8767864],[11.0492608,36.8765975],[11.0496015,36.876295],[11.0500226,36.8759324],[11.0504061,36.875735],[11.0508111,36.8755913],[11.0512752,36.8755355],[11.0516265,36.8756127],[11.0518357,36.8754582],[11.0519269,36.8753424],[11.0519699,36.8751557],[11.0520905,36.874866],[11.0522729,36.8746944],[11.0526672,36.8745163],[11.0531071,36.8747781],[11.0537508,36.8745463],[11.0540083,36.8743876],[11.0542766,36.8739627],[11.0544858,36.8730766],[11.054231,36.8728749],[11.0545555,36.8728534],[11.0554245,36.8720595],[11.0565028,36.8709523],[11.0570097,36.870742],[11.0576025,36.8699696],[11.058088,36.870197],[11.0581443,36.8700597],[11.058611,36.8698837],[11.0591233,36.8692915],[11.0594666,36.8687336],[11.0603464,36.8684675],[11.0606897,36.867798],[11.0608399,36.8676779],[11.0612798,36.8674118],[11.0627604,36.8657552],[11.0645414,36.8670169]]

const MASK_GEOJSON: GeoJSON.Feature<GeoJSON.Polygon> = {
  type: 'Feature',
  properties: {},
  geometry: {
    type: 'Polygon',
    coordinates: [
      [[-180,-90],[180,-90],[180,90],[-180,90],[-180,-90]],
      [...KELIBIA_COORDS].reverse(),
    ],
  },
}



type UserInfo = {

  first_name: string

  last_name: string

  first_name_ar?: string

  last_name_ar?: string

  email: string

  is_verified: boolean

  phone?: string

  city?: string

  cin?: string

  user_type?: string

  is_staff?: boolean

  is_superuser?: boolean

  has_active_asd?: boolean

}



type ForumNotif = { id: number; is_read: boolean }



/* ── Styling ── */

const CSS = `

.db-section-bar { display:flex; align-items:center; justify-content:space-between; margin-bottom:24px; }

.db-section-title {

  font-size:1rem; font-weight:800; color:#1a1c1c;

  display:flex; align-items:center; gap:10px;

  font-family:'Public Sans',sans-serif;

}

.db-section-title::before {

  content:''; display:inline-block; width:5px; height:28px;

  background:linear-gradient(135deg, #b87a50 0%, #d4aa8d 100%); border-radius:3px; flex-shrink:0;

}

.db-action-card {

  display:flex; flex-direction:column; align-items:center; text-align:center;

  padding:14px 8px; background:#fff; border:1px solid transparent;

  transition:all .2s; cursor:pointer; text-decoration:none; color:inherit;

}

.db-action-card:hover {

  background:#fff; border-color:rgba(228,190,186,.4);

  box-shadow:0 12px 32px -4px rgba(26,28,28,.07);

}

.db-action-icon {

  width:38px; height:38px; border-radius:50%;

  background:rgba(212,170,141,.08); display:flex; align-items:center;

  justify-content:center; margin-bottom:8px; transition:transform .2s;

  color:#d4aa8d; font-size:1rem;

}

.db-action-card:hover .db-action-icon { transform:scale(1.1); }

.db-action-label { font-size:.65rem; font-weight:700; color:#1a1c1c; text-transform:uppercase; letter-spacing:.4px; line-height:1.3; }

.db-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

@media (max-width: 768px) {
  .db-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}



/* Right sidebar */

.db-profile-card { background:#fff; padding:28px; box-shadow:0 12px 32px -4px rgba(26,28,28,.06); }

.db-profile-avatar {

  width:58px; height:58px; border-radius:50%; background:#e8e8e8;

  overflow:hidden; border:2px solid rgba(212,170,141,.18);

}

.db-profile-avatar-inner {

  width:100%; height:100%; display:flex; align-items:center; justify-content:center;

  font-size:1.4rem; font-weight:800; color:#d4aa8d; background:#fef2f2;

}

.db-stat-row {

  display:flex; justify-content:space-between; align-items:center;

  font-size:.85rem; padding:8px 0;

  border-bottom:1px solid #e8e8e8;

}

.db-stat-badge {

  background:rgba(212,170,141,.1); color:#d4aa8d;

  font-weight:800; padding:2px 8px; border-radius:3px; font-size:.78rem;

}

.db-reclamation-btn {

  width:100%; padding:16px; background:#E6F4F7; color:#0F4C5C;

  font-weight:700; font-size:.82rem; letter-spacing:1.5px; text-transform:uppercase;

  border:1px solid #B5DDE5; cursor:pointer; display:flex; align-items:center; justify-content:center;

  gap:10px; transition:background .2s, color .2s; font-family:'Public Sans',sans-serif;

  text-decoration:none;

}

.db-reclamation-btn:hover { background:#B5DDE5; color:#0F4C5C; }

.db-news-item { cursor:pointer; }

.db-news-item:hover .db-news-headline { color:#d4aa8d; }

.db-news-time { font-size:.68rem; font-weight:700; color:#d4aa8d; display:block; margin-bottom:3px; }

.db-news-headline { font-size:.82rem; font-weight:700; color:#1a1c1c; line-height:1.35; transition:color .15s; }

.db-news-ar { font-size:.68rem; color:#5b403d; margin-top:2px; }

.db-urgence { background:#C44536; padding:28px; color:#fff; }

.db-urgence-title { font-size:1rem; font-weight:800; text-transform:uppercase; letter-spacing:.5px; margin-bottom:16px; font-family:'Public Sans',sans-serif; }

.db-urgence-row { display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; }

.db-urgence-label { font-size:.75rem; font-weight:500; opacity:.9; }

.db-urgence-number { font-size:1.4rem; font-weight:800; letter-spacing:-.5px; }



/* Reclamation rows */

.db-rec-row {

  display:flex; align-items:center; justify-content:space-between;

  padding:14px 16px; border:1px solid #eeeeee;

  background:#f9f9f9; transition:border-color .15s;

}

.db-rec-row:hover { border-color:#e4beba; }

.db-rec-icon { width:44px; height:44px; border-radius:50%; background:rgba(212,170,141,.08); display:flex; align-items:center; justify-content:center; color:#d4aa8d; flex-shrink:0; }

.db-status-badge { font-size:.65rem; font-weight:800; padding:4px 10px; text-transform:uppercase; letter-spacing:.5px; border-radius:2px; }



/* Footer */

.db-footer { background:#e8e8e8; padding:40px 48px; margin-top:0; border-top:1px solid transparent; }

.db-footer-grid { display:grid; grid-template-columns:2fr 1fr 1fr; gap:32px; }

.db-footer-brand { font-size:1.05rem; font-weight:900; color:#d4aa8d; text-transform:uppercase; letter-spacing:-.3px; font-family:'Public Sans',sans-serif; }

.db-footer-copy { font-size:.72rem; color:#5b403d; margin-top:4px; }

.db-footer-heading { font-size:.75rem; font-weight:800; text-transform:uppercase; letter-spacing:.5px; margin-bottom:14px; color:#1a1c1c; }

.db-footer-link { display:block; font-size:.75rem; color:#5b403d; text-decoration:none; margin-bottom:6px; }

.db-footer-link:hover { color:#d4aa8d; }

.db-footer-social { display:flex; gap:10px; margin-top:4px; }

.db-footer-social-btn {

  width:32px; height:32px; border-radius:50%; background:#dadada;

  display:flex; align-items:center; justify-content:center;

  font-size:.8rem; color:#1a1c1c; transition:all .2s; text-decoration:none;

}

.db-footer-social-btn:hover { background:linear-gradient(135deg, #b87a50 0%, #d4aa8d 100%); color:#fff; }

.db-footer-bottom { margin-top:32px; padding-top:20px; border-top:1px solid rgba(26,28,28,.08); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; }

.db-footer-legal { font-size:.65rem; color:#5b403d; font-weight:500; text-transform:uppercase; letter-spacing:1px; }

.db-footer-legal a { color:#5b403d; text-decoration:none; margin-left:20px; }

.db-footer-legal a:hover { color:#d4aa8d; }



@media (max-width:900px) {

  .db-footer-grid { grid-template-columns:1fr; }

}

`



export default function DashboardPage() {

  const { t, lang } = useI18n()

  const navigate = useNavigate()



  const [user, setUser] = useState<UserInfo | null>(null)

  const [marriageNotifications, setMarriageNotifications] = useState<any[]>([])

  const [forumUnread, setForumUnread] = useState(0)

  const [reclamations, setReclamations] = useState<any[]>([])

  const [livretNotifications, setLivretNotifications] = useState<any[]>([])

  const [loadingMap, setLoadingMap] = useState(true)

  const [newsItems, setNewsItems] = useState<{ id: number; title: string; created_at: string }[]>([])
  const [genericNotifications, setGenericNotifications] = useState<any[]>([])
  const [mapStatusFilter, setMapStatusFilter] = useState<string[]>(['pending', 'in_progress', 'resolved', 'rejected'])
  const [dossiersCount, setDossiersCount] = useState(0)

  const [sigLayers, setSigLayers] = useState<{ routes: any; espVerts: any; batiments: any; limite: any }>({
    routes: null, espVerts: null, batiments: null, limite: null,
  })
  const [showMask, setShowMask] = useState(false)
  // Charger les couches SIG GeoJSON — citoyen (4 couches réelles WGS84)
  useEffect(() => {
    const load = async () => {
      try {
        const [rRes, evRes, bRes, lRes] = await Promise.all([
          fetch('/layers/routes_lignes.geojson'),
          fetch('/layers/zones_vertes_complet.geojson'),
          fetch('/layers/batiments_polygones.geojson'),
          fetch('/layers/limite_kelibia_v2.geojson'),
        ])
        const [routes, espVerts, batiments, limite] = await Promise.all([
          rRes.json(), evRes.json(), bRes.json(), lRes.json()
        ])
        setSigLayers({ routes, espVerts, batiments, limite })
      } catch {/* silencieux si fichiers absents */}
    }
    load()
  }, [])

  useEffect(() => {

    const access = getAccessToken()

    if (!access) { navigate('/login'); return }

    ;(async () => {

      try {

        const res = await fetch(resolveBackendUrl('/api/accounts/me/'), { headers: { Authorization: `Bearer ${access}` } })

        if (res.ok) {

          const data = (await res.json()) as UserInfo

          setUser(data)

          if (data.user_type === 'agent' || data.is_staff || data.is_superuser) { navigate('/agent-dashboard'); return }

        }
        const [rRes, mRes, bRes, resRes, cRes, lRes, nRes, newsRes, gnRes, iRes, comRes] = await Promise.all([
          fetch(resolveBackendUrl('/api/reclamations/'), { headers: { Authorization: `Bearer ${access}` } }),
          fetch(resolveBackendUrl('/extrait-mariage/demandes/'), { headers: { Authorization: `Bearer ${access}` } }),
          fetch(resolveBackendUrl('/extrait-naissance/api/declaration/'), { headers: { Authorization: `Bearer ${access}` } }),
          fetch(resolveBackendUrl('/api/residence/demande/'), { headers: { Authorization: `Bearer ${access}` } }),
          fetch(resolveBackendUrl('/api/construction/demandes/'), { headers: { Authorization: `Bearer ${access}` } }),
          fetch(resolveBackendUrl('/livret-famille/demandes/'), { headers: { Authorization: `Bearer ${access}` } }),
          fetch(resolveBackendUrl('/api/forum/notifications/'), { headers: { Authorization: `Bearer ${access}` } }),
          fetch(resolveBackendUrl('/api/news/')),
          fetch(resolveBackendUrl('/api/notifications/'), { headers: { Authorization: `Bearer ${access}` } }),
          fetch(resolveBackendUrl('/api/impots/demande/'), { headers: { Authorization: `Bearer ${access}` } }),
          fetch(resolveBackendUrl('/api/commerce/demande/'), { headers: { Authorization: `Bearer ${access}` } })
        ])

        let totalDossiers = 0
        if (rRes.ok) { const d = await rRes.json(); setReclamations(d); totalDossiers += d.length }
        if (mRes.ok) { const d = await mRes.json(); setMarriageNotifications(d.filter((x: any) => x.status === 'signed')); totalDossiers += d.length }
        if (bRes.ok) { const d = await bRes.json(); totalDossiers += d.length }
        if (resRes.ok) { const d = await resRes.json(); totalDossiers += d.length }
        if (cRes.ok) { const d = await cRes.json(); totalDossiers += d.length }
        if (lRes.ok) { const d = await lRes.json(); setLivretNotifications(d.filter((x: any) => x.status === 'ready')); totalDossiers += d.length }
        if (iRes && iRes.ok) { const d = await iRes.json(); totalDossiers += d.length }
        if (comRes && comRes.ok) { const d = await comRes.json(); totalDossiers += d.length }
        setDossiersCount(totalDossiers)

        if (nRes.ok) { const d = (await nRes.json()) as ForumNotif[]; setForumUnread(d.filter(n => !n.is_read).length) }
        if (newsRes.ok) { const d = await newsRes.json(); setNewsItems((Array.isArray(d) ? d : (d.results || [])).slice(0, 3)) }
        if (gnRes.ok) { setGenericNotifications(await gnRes.json()) }

      } catch (e) { console.error(e) }

      finally { setLoadingMap(false) }

    })()

  }, [navigate])



  function logout() { clearTokens(); navigate('/login') }



  const getMarkerIcon = (status: string) => {

    const colors: Record<string, string> = { pending: '#f57f17', in_progress: '#c61f2c', resolved: '#2e7d32', rejected: '#c62828' }

    const color = colors[status] || '#c61f2c'

    return L.divIcon({

      className: 'custom-div-icon',

      html: `<div style="background:${color};width:13px;height:13px;border-radius:50%;border:2px solid #fff;box-shadow:0 0 5px rgba(0,0,0,.3)"></div>`,

      iconSize: [13, 13], iconAnchor: [6, 6],

    })

  }



  const statusConfig: Record<string, { bg: string; color: string; label: string }> = {

    pending:     { bg: '#fef2f2', color: '#d4aa8d', label: t('status_pending') },

    in_progress: { bg: '#fde8ea', color: '#c61f2c', label: t('status_in_progress') },

    resolved:    { bg: '#f0fdf4', color: '#166534', label: t('status_resolved') },

    rejected:    { bg: '#fef2f2', color: '#d4aa8d', label: t('status_rejected') },

  }



  const catIcons: Record<string, string> = {

    lighting: 'fas fa-lightbulb', trash: 'fas fa-trash-alt',

    roads: 'fas fa-road', noise: 'fas fa-volume-up', other: 'fas fa-exclamation-circle',

  }



  const userName = user

    ? (lang === 'ar' && user.first_name_ar ? `${user.first_name_ar} ${user.last_name_ar ?? ''}` : `${user.first_name} ${user.last_name}`)

    : t('loading')



  const userInitial = user

    ? (lang === 'ar' && user.first_name_ar ? user.first_name_ar[0] : user.first_name[0]).toUpperCase()

    : '?'



  /* ── Right sidebar ── */

  const rightSidebar = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 8 }} dir={lang === 'ar' ? 'rtl' : 'ltr'} className={lang === 'ar' ? 'font-arabic' : ''}>

      <style>{CSS}</style>



      {/* Profile card */}

      <div className="db-profile-card">

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>

          <div className="db-profile-avatar">

            <div className="db-profile-avatar-inner">{userInitial}</div>

          </div>

          <div>

            <div style={{ fontWeight: 800, fontSize: '.88rem', color: '#1a1c1c', fontFamily: 'Public Sans,sans-serif' }}>{userName}</div>

            <div style={{ fontSize: '.7rem', color: '#5b403d', marginTop: 2 }}>

              {user?.is_verified ? t('citoyen_role') : t('account_waiting_verification')}

            </div>

          </div>

        </div>

        <div>
          <div className="db-stat-row" style={{ borderBottom: 'none' }}>
            <span style={{ color: '#5b403d' }}>{t('my_files_label')}</span>
            <span className="db-stat-badge" style={{ [lang === 'ar' ? 'marginRight' : 'marginLeft']: 'auto' }}>{String(dossiersCount).padStart(2, '0')}</span>
          </div>
        </div>

        <Link
          to="/profile"
          style={{ display: 'block', width: '100%', marginTop: 18, padding: '10px', textAlign: 'center', background: '#e8e8e8', color: '#1a1c1c', fontWeight: 800, fontSize: '.72rem', textTransform: 'uppercase', letterSpacing: '1px', textDecoration: 'none', transition: 'background .2s', borderRadius: '4px' }}
          onMouseEnter={e => (e.currentTarget.style.background = '#dadada')}
          onMouseLeave={e => (e.currentTarget.style.background = '#e8e8e8')}
        >
          {t('my_account_btn')}
        </Link>

        <button
          onClick={logout}
          style={{ display: 'block', width: '100%', marginTop: 8, padding: '10px', textAlign: 'center', background: '#fef2f2', color: '#dc3545', border: '1px solid #fee2e2', fontWeight: 800, fontSize: '.72rem', textTransform: 'uppercase', letterSpacing: '1px', transition: 'background .2s', borderRadius: '4px', cursor: 'pointer' }}
          onMouseEnter={e => (e.currentTarget.style.background = '#fee2e2')}
          onMouseLeave={e => (e.currentTarget.style.background = '#fef2f2')}
        >
          <i className={`fas fa-sign-out-alt ${lang === 'ar' ? 'ms-2' : 'me-2'}`}></i>
          {t('logout')}
        </button>


      </div>



      {/* Big red CTA */}
      <Link to="/nouvelle-reclamation" className="db-reclamation-btn">
        <i className="fas fa-plus-circle"></i>
        {t('new_signalement_btn')}
      </Link>



      {/* Recent news list */}

      <div style={{ background: '#fff', padding: '24px' }}>

        <div style={{ fontWeight: 800, fontSize: '.82rem', color: '#1a1c1c', textTransform: 'uppercase', letterSpacing: '.5px', paddingBottom: 6, borderBottom: '2px solid #d4aa8d', display: 'inline-block', marginBottom: 16, fontFamily: 'Public Sans,sans-serif' }}>

          {t('news_title')}

        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

          {newsItems.length > 0 ? newsItems.map(item => (

            <Link key={item.id} to="/news" className="db-news-item" style={{ textDecoration: 'none' }}>
              <span className="db-news-time">
                {new Date(item.created_at).toLocaleDateString(lang === 'ar' ? 'ar-TN' : 'fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase()}
              </span>
              <div className="db-news-headline">{item.title}</div>
            </Link>

          )) : (

            <>

              <div className="db-news-item">

                <span className="db-news-time">{t('news_date_1')}</span>

                <div className="db-news-headline">{t('news_item_1')}</div>

              </div>

              <div className="db-news-item">

                <span className="db-news-time">{t('news_date_2')}</span>

                <div className="db-news-headline">{t('news_item_2')}</div>

              </div>

            </>

          )}

        </div>

        <Link
          to="/news"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 20, fontSize: '.72rem', fontWeight: 800, color: '#d4aa8d', textDecoration: 'none', textTransform: 'uppercase', borderBottom: '2px solid rgba(212,170,141,.2)', paddingBottom: 2 }}
        >
          {t('see_all_news')} <i className={`fas ${lang === 'ar' ? 'fa-arrow-left' : 'fa-arrow-right'}`} style={{ fontSize: '.7rem' }}></i>
        </Link>

      </div>



      {/* Urgence panel */}

      <div className="db-urgence">

        <div className="db-urgence-title">{lang === 'ar' ? 'طوارئ' : 'Urgence'}</div>

        <div className="db-urgence-row">

          <span className="db-urgence-label">{lang === 'ar' ? 'الحماية المدنية' : 'Protection Civile'}</span>

          <span className="db-urgence-number">198</span>

        </div>

        <div className="db-urgence-row" style={{ marginBottom: 0 }}>

          <span className="db-urgence-label">{lang === 'ar' ? 'طوارئ البلدية' : 'S.O.S Municipalité'}</span>

          <span className="db-urgence-number">72 295 034</span>

        </div>

      </div>

    </div>

  )



  return (

    <MainLayout user={user} onLogout={logout} showHero={true} rightSidebar={rightSidebar}>

      <style>{CSS}</style>



      {/* ── Alerts ── */}

      {user && !user.is_verified && (

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 18px', marginBottom: 18, borderLeft: '4px solid #f59e0b', background: '#fffbeb', borderRadius: 2 }}>

          <i className="fas fa-exclamation-triangle" style={{ color: '#d97706', marginTop: 2 }}></i>

          <div>

            <div style={{ fontWeight: 700, color: '#92400e', marginBottom: 2 }}>{t('account_waiting_verification')}</div>

            <div style={{ fontSize: '.82rem', color: '#b45309' }}>{t('unverified_msg')}</div>

          </div>

        </div>

      )}



      {marriageNotifications.length > 0 && (

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', marginBottom: 16, background: '#eff6ff', borderLeft: '4px solid #f18221', borderRadius: 2 }}>

          <i className="fas fa-ring" style={{ color: '#f18221' }}></i>

          <div style={{ flex: 1 }}>

            <div style={{ fontWeight: 700, color: '#1e40af' }}>{t('notification_mariage_signed')}</div>

          </div>

          <Link to="/mes-mariages" style={{ padding: '6px 16px', background: '#c61f2c', color: '#fff', fontWeight: 700, fontSize: '.78rem', textDecoration: 'none', borderRadius: 999 }}>

            {t('view_mariage_cert')}

          </Link>

        </div>

      )}



      {livretNotifications.map((notif: any) => (
        <div key={notif.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', marginBottom: 16, background: '#f0fdf4', borderLeft: '4px solid #22c55e', borderRadius: 2 }}>
          <i className="fas fa-book-open" style={{ color: '#16a34a' }}></i>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: '#166534' }}>{t('livret_famille_ready')}</div>
            <div style={{ fontSize: '.78rem', color: '#15803d' }}>{t('livret_famille_ready_msg').replace('{guichet}', notif.guichet_recuperation || '..')}</div>
          </div>
          <Link to="/mes-demandes" style={{ padding: '6px 16px', background: '#166534', color: '#fff', fontWeight: 700, fontSize: '.78rem', textDecoration: 'none', borderRadius: 999 }}>
            {t('view_requests')}
          </Link>
        </div>
      ))}

      {genericNotifications.filter(n => !n.is_read).map((notif: any) => (
        <div key={notif.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', marginBottom: 16, background: '#fff', borderLeft: '4px solid #c61f2c', borderRadius: 2, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <i className={`fas ${notif.notification_type === 'success' ? 'fa-check-circle' : 'fa-info-circle'}`} style={{ color: notif.notification_type === 'success' ? '#16a34a' : '#c61f2c' }}></i>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: '#1a1c1c' }}>{notif.title}</div>
            <div style={{ fontSize: '.78rem', color: '#5b403d' }}>{notif.message}</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {notif.link && (
              <Link to={notif.link} className="btn-notif-action" style={{ padding: '4px 12px', background: '#f3f4f6', color: '#374151', fontWeight: 700, fontSize: '.7rem', textDecoration: 'none', borderRadius: 4 }}>
                {t('view_details') || 'Voir détails'}
              </Link>
            )}
            <button 
              onClick={async () => {
                const access = getAccessToken();
                await fetch(resolveBackendUrl(`/api/notifications/${notif.id}/mark_as_read/`), { 
                  method: 'POST', 
                  headers: { Authorization: `Bearer ${access}` } 
                });
                setGenericNotifications(prev => prev.filter(n => n.id !== notif.id));
              }}
              style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '.8rem' }}
              title={t('mark_as_read') || 'Marquer comme lu'}
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>
      ))}



      {/* ── Quick Actions ── */}

      <div style={{ marginBottom: 28 }}>

        <div className="db-section-bar">

          <h3 className="db-section-title">{t('quick_actions')}</h3>

        </div>

        <div className="db-grid">

          {[
            { to: '/mes-extraits',         icon: 'fas fa-file-contract', labelKey: 'extraits_hub_title' },

            { to: '/services',             icon: 'fas fa-receipt',       labelKey: 'admin_services' },

            { to: '/mes-demandes',         icon: 'fas fa-calendar-alt',  labelKey: 'my_requests' },

            { to: '/demande-construction', icon: 'fas fa-hard-hat',      labelKey: 'permis_construire' },

            { to: '/news',                 icon: 'fas fa-leaf',          labelKey: 'news_title' },

            { to: '/nouvelle-reclamation', icon: 'fas fa-traffic-light', labelKey: 'new_signalement' },

            { to: '/forum',                icon: 'fas fa-comments',      labelKey: 'forum' },

          ].map(item => (

            <Link key={item.to + item.labelKey} to={item.to} className="db-action-card">

              <div className="db-action-icon"><i className={item.icon}></i></div>

              <span className="db-action-label">{t(item.labelKey)}</span>

            </Link>

          ))}

        </div>

      </div>



      {/* ── Map ── */}

      <div style={{ background: '#fff', marginBottom: 28, border: '1px solid #eeeeee' }} id="mapCard">

        <div style={{ padding: '14px 18px', borderBottom: '1px solid #eeeeee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>

            <div style={{ fontWeight: 800, fontSize: '.88rem', color: '#1a1c1c', fontFamily: 'Public Sans,sans-serif' }}>{t('map_title_realtime')}</div>

            <button
              onClick={() => setShowMask(m => !m)}
              title="Masquer hors commune"
              style={{
                padding: '3px 10px', fontSize: '.68rem', fontWeight: 700,
                background: showMask ? '#1a237e' : '#e8e8e8',
                color: showMask ? '#fff' : '#1a1c1c',
                border: '1px solid ' + (showMask ? '#1a237e' : '#ccc'),
                borderRadius: 3, cursor: 'pointer', letterSpacing: '.3px',
                display: 'flex', alignItems: 'center', gap: 5,
              }}
            >
              <i className="fas fa-mask" style={{ fontSize: '.65rem' }}></i>
              {showMask ? 'Masque ON' : 'Masque OFF'}
            </button>

          </div>

          <div style={{ display: 'flex', gap: 14 }}>

            {[

              { color: '#f57f17', label: lang === 'ar' ? 'بانتظار' : 'En attente', key: 'pending' },

              { color: '#c61f2c', label: lang === 'ar' ? 'قيد التنفيذ' : 'En cours', key: 'in_progress' },

              { color: '#2e7d32', label: lang === 'ar' ? 'محلول' : 'Résolu', key: 'resolved' },

              { color: '#c62828', label: lang === 'ar' ? 'مرفوض' : 'Rejeté', key: 'rejected' },

            ].map(i => {
              const active = mapStatusFilter.includes(i.key);
              return (

              <button
                key={i.key}
                onClick={() => setMapStatusFilter(prev => 
                  active ? prev.filter(x => x !== i.key) : [...prev, i.key]
                )}
                style={{ 
                  display: 'flex', alignItems: 'center', gap: 5, fontSize: '.72rem', 
                  color: active ? '#1a1c1c' : '#9ca3af',
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  opacity: active ? 1 : 0.5, transition: 'all 0.2s', padding: 0
                }}
              >

                <span style={{ width: 8, height: 8, borderRadius: '50%', background: active ? i.color : '#ccc', display: 'inline-block' }}></span>

                {i.label}

              </button>

            )})}

          </div>

        </div>

        <div style={{ height: 360, position: 'relative' }}>

          {loadingMap ? (

            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9f9f9' }}>

              <div className="spinner-border text-primary" role="status"></div>

            </div>

          ) : (

            <MapContainer center={KELIBIA_CENTER} zoom={14} style={{ height: '100%', width: '100%' }}>

              <LayersControl position="topright">

                <LayersControl.BaseLayer checked name={t('map_osm')}>
                  <TileLayer url="https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png" />
                </LayersControl.BaseLayer>

                <LayersControl.BaseLayer name={t('map_satellite')}>
                  <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
                </LayersControl.BaseLayer>

                {/* Couches SIG — citoyen (données réelles QGIS/WGS84) */}

                {sigLayers.limite && (
                  <LayersControl.Overlay checked name="🏛️ Limite communale">
                    <GeoJSON
                      data={sigLayers.limite}
                      style={() => ({ color: '#1a237e', weight: 3, fill: false, dashArray: '8,4', opacity: 0.9 })}
                      onEachFeature={(_feature, layer) => layer.bindPopup('<b>🏛️ Kelibia</b><br/>Limite de la commune')}
                    />
                  </LayersControl.Overlay>
                )}

                {sigLayers.routes && (
                  <LayersControl.Overlay name="🛣️ Routes">
                    <GeoJSON
                      data={sigLayers.routes}
                      style={(feature: any) => {
                        const type = feature?.properties?.highway || ''
                        const color = type === 'primary' || type === 'secondary_link' ? '#c62828'
                                    : (type === 'secondary' || type.startsWith('tertiary')) ? '#e65100'
                                    : (type === 'residential' || type === 'unclassified') ? '#546e7a'
                                    : '#b0bec5'
                        const weight = type === 'primary' || type === 'secondary_link' ? 4
                                     : (type === 'secondary' || type.startsWith('tertiary')) ? 3
                                     : 1.5
                        return { color, weight, opacity: 0.85 }
                      }}
                      onEachFeature={(feature, layer) => {
                        const p = feature.properties || {}
                        const nom = p['name:fr'] || p.name || p.ref || '(sans nom)'
                        layer.bindPopup(`<b>🛣️ ${nom}</b><br/>Type : ${p.highway || '—'}`)
                      }}
                    />
                  </LayersControl.Overlay>
                )}

                {sigLayers.espVerts && (
                  <LayersControl.Overlay checked name="🌳 Espaces verts">
                    <GeoJSON
                      data={sigLayers.espVerts}
                      style={() => ({ color: '#2e7d32', weight: 1.5, fillColor: '#a5d6a7', fillOpacity: 0.5 })}
                      onEachFeature={(feature, layer) => {
                        const p = feature.properties || {}
                        const nom = p.nom || p['name:fr'] || p.name || 'Espace vert'
                        const type = p.type || p.usage_sol || p.naturel || p.loisir || p.landuse || p.leisure || '—'
                        layer.bindPopup(`<b>🌳 ${nom}</b><br/>Type : ${type}`)
                      }}
                    />
                  </LayersControl.Overlay>
                )}


              </LayersControl>

              <TileLayer url="https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png" />

              {reclamations.filter((rec: any) => mapStatusFilter.includes(rec.status)).map((rec: any) =>

                rec.latitude && rec.longitude && (

                  <Marker key={rec.id} position={[rec.latitude, rec.longitude]} icon={getMarkerIcon(rec.status)}>

                    <Popup>

                      <div style={{ padding: 4 }}>

                        <div style={{ fontWeight: 700, marginBottom: 4 }}>{rec.title}</div>

                        <div style={{ fontSize: '.78rem', color: '#5b403d', marginBottom: 6 }}>{rec.description}</div>

                        <span style={{ ...statusConfig[rec.status], padding: '2px 8px', fontSize: '.65rem', fontWeight: 800, borderRadius: 2 }}>

                          {statusConfig[rec.status]?.label}

                        </span>

                      </div>

                    </Popup>

                  </Marker>

                )

              )}

              {showMask && (
                <GeoJSON
                  key="mask"
                  data={MASK_GEOJSON as any}
                  style={() => ({ fillColor: '#888888', fillOpacity: 0.55, color: 'transparent', weight: 0, interactive: false })}
                />
              )}

            </MapContainer>

          )}

        </div>

      </div>



      {/* ── Mes réclamations ── */}

      <div style={{ background: '#fff', border: '1px solid #eeeeee', marginBottom: 28 }}>

        <div style={{ padding: '14px 18px', borderBottom: '1px solid #eeeeee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>

          <h3 style={{ fontWeight: 800, fontSize: '.88rem', margin: 0, fontFamily: 'Public Sans,sans-serif', color: '#1a1c1c' }}>

            {t('my_reclamations')}

          </h3>

          <Link

            to="/nouvelle-reclamation"

            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 18px', background: '#E6F4F7', color: '#0F4C5C', border: '1px solid #B5DDE5', fontWeight: 700, fontSize: '.78rem', textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '.5px' }}

          >

            <i className="fas fa-plus-circle"></i>

            {t('new_signalement')}

          </Link>

        </div>

        <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>

          {reclamations.slice(0, 3).length === 0 ? (

            <p style={{ textAlign: 'center', color: '#9ca3af', padding: '24px 0', fontSize: '.85rem' }}>

              {t('no_reclamations') || "Aucune réclamation pour l'instant"}

            </p>

          ) : (

            reclamations.slice(0, 3).map((rec: any) => {

              const sc = statusConfig[rec.status] || statusConfig['pending']

              return (

                <div key={rec.id} className="db-rec-row">

                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>

                    <div className="db-rec-icon">

                      <i className={catIcons[rec.category] || 'fas fa-exclamation-circle'}></i>

                    </div>

                    <div>

                      <div style={{ fontWeight: 700, fontSize: '.85rem', color: '#1a1c1c' }}>{rec.title}</div>

                      <div style={{ fontSize: '.7rem', color: '#5b403d', marginTop: 2 }}>

                        {new Date(rec.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long' })}

                      </div>

                    </div>

                  </div>

                  <span className="db-status-badge" style={{ background: sc.bg, color: sc.color }}>{sc.label}</span>

                </div>

              )

            })

          )}

          {reclamations.length > 3 && (

            <Link to="/mes-reclamations" style={{ textAlign: 'center', display: 'block', fontSize: '.78rem', fontWeight: 700, color: '#d4aa8d', textDecoration: 'none', padding: '10px 0' }}>

              {t('view_all') || 'Voir tout'} ({reclamations.length})

            </Link>

          )}

        </div>

      </div>



      {/* ── Forum card ── */}

      <div style={{ background: '#fff', border: '1px solid #eeeeee', borderLeft: '4px solid #1D6FA3', padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 36 }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>

          <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'rgba(29,111,163,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1D6FA3', fontSize: '1rem' }}>

            <i className="fas fa-comments"></i>

          </div>

          <div>

            <div style={{ fontWeight: 800, color: '#1a1c1c', fontFamily: 'Public Sans,sans-serif' }}>

              {t('forum')}

              {forumUnread > 0 && (

                <span style={{ marginLeft: 8, background: '#d4aa8d', color: '#fff', fontSize: '.62rem', fontWeight: 800, padding: '1px 7px', borderRadius: 999 }}>{forumUnread}</span>

              )}

            </div>

            <div style={{ fontSize: '.75rem', color: '#5b403d', marginTop: 2 }}>{t('forum_desc')}</div>

          </div>

        </div>

        <Link

          to="/forum"

          style={{ padding: '8px 18px', border: '1.5px solid #1D6FA3', color: '#1D6FA3', fontWeight: 700, fontSize: '.78rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}

        >

          <i className="fas fa-arrow-right"></i> {t('forum')}

        </Link>

      </div>



      {/* ── Footer ── */}

      <div className="db-footer" style={{ marginLeft: -32, marginRight: -32, marginBottom: -24 }}>

        <div className="db-footer-grid">

          <div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>

              <i className="fas fa-landmark" style={{ color: '#d4aa8d', fontSize: '1.1rem' }}></i>

              <span className="db-footer-brand">{lang === 'ar' ? 'بلدية قليبية' : 'VILLE DE KÉLIBIA'}</span>

            </div>

            <p style={{ fontSize: '.75rem', color: '#5b403d', lineHeight: 1.65, maxWidth: 340, margin: 0 }}>

              {t('footer_text')}

            </p>

          </div>

          <div>

            <div className="db-footer-heading">Liens Utiles</div>

            <a href="#" className="db-footer-link">Mairie &amp; Conseil</a>

            <a href="#" className="db-footer-link">Culture &amp; Patrimoine</a>

            <a href="#" className="db-footer-link">Tourisme</a>

            <a href="#" className="db-footer-link">Plan de ville</a>

          </div>

          <div>

            <div className="db-footer-heading">Suivez-nous</div>

            <div className="db-footer-social">

              <a href="#" className="db-footer-social-btn"><i className="fas fa-globe"></i></a>

              <a href="#" className="db-footer-social-btn"><i className="fas fa-share-alt"></i></a>

              <a href="#" className="db-footer-social-btn"><i className="fas fa-envelope"></i></a>

            </div>

          </div>

        </div>

        <div className="db-footer-bottom">

          <span className="db-footer-legal">© 2024 Commune de Kélibia — Tous droits réservés</span>

          <div>

            <a href="#" className="db-footer-legal" style={{ marginLeft: 0 }}>Mentions Légales</a>

            <a href="#" className="db-footer-legal">Confidentialité</a>

          </div>

        </div>

      </div>

    </MainLayout>

  )

}

