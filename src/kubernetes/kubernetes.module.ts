import { Module } from '@nestjs/common';
import { ConfigModule } from 'src/config/config.module';
import { K8sJobService } from './k8s-job.service';

@Module({
	imports: [ConfigModule],
	providers: [K8sJobService],
	exports: [K8sJobService],
})
export class KubernetesModule {}
